import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, attachmentsTable, pendingUploadsTable, incidentsTable, contractsTable, companyMetricsTable } from "@workspace/db";
import { CreateAttachmentBody, DeleteAttachmentParams, GetAttachmentContentParams, RequestUploadUrlBody, RequestUploadUrlResponse, CreateAttachmentResponse } from "@workspace/api-zod";
import { can } from "../lib/authorization-policy";
import { objectFile, streamObject, uploadObject } from "../lib/objectStorage";
import { serializeAttachment } from "../lib/api-serialization";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxSize = 10 * 1024 * 1024;
const maxPendingBytesPerCompany = 100 * 1024 * 1024;
const maxPendingUploadsPerCompany = 20;
const uploadTtlMs = 15 * 60_000;

export function createAttachmentsRouter(storage = { objectFile, streamObject, uploadObject }): IRouter {
  const router: IRouter = Router();

  const deletePendingObject = async (pending: { id: string; objectPath: string }) => {
    const [claimed] = await db.select({ id: attachmentsTable.id }).from(attachmentsTable).where(eq(attachmentsTable.objectPath, pending.objectPath));
    if (!claimed) await storage.objectFile(pending.objectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
    await db.delete(pendingUploadsTable).where(eq(pendingUploadsTable.id, pending.id));
  };

  const cleanupExpiredUploads = async () => {
    const expired = await db.select({ id: pendingUploadsTable.id, objectPath: pendingUploadsTable.objectPath })
      .from(pendingUploadsTable).where(lt(pendingUploadsTable.expiresAt, new Date()));
    await Promise.all(expired.map(deletePendingObject));
  };

  router.post("/storage/uploads/request-url", async (req, res): Promise<void> => {
    if (!req.authorization || !req.userId || !can(req.authorization.role, "evidence")) { res.status(403).json({ error: "Forbidden" }); return; }
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success || !allowed.has(parsed.data?.contentType ?? "") || (parsed.data?.size ?? 0) < 1 || (parsed.data?.size ?? 0) > maxSize) {
      res.status(400).json({ error: "Solo se permiten JPG, PNG, WEBP o PDF de hasta 10 MB" }); return;
    }
    await cleanupExpiredUploads();
    const companyId = req.authorization.companyId;
    const pending = await db.select({ size: pendingUploadsTable.size }).from(pendingUploadsTable).where(eq(pendingUploadsTable.companyId, companyId));
    const reservedBytes = pending.reduce((sum, item) => sum + item.size, 0);
    if (pending.length >= maxPendingUploadsPerCompany || reservedBytes + parsed.data.size > maxPendingBytesPerCompany) {
      res.status(429).json({ error: "Hay demasiadas cargas pendientes; completa o espera a que expiren antes de intentar de nuevo" }); return;
    }
    const uploadId = randomUUID();
    const objectPath = `/objects/uploads/${uploadId}`;
    await db.insert(pendingUploadsTable).values({
      id: uploadId,
      companyId,
      userId: req.userId,
      objectPath,
      fileName: parsed.data.name,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
      expiresAt: new Date(Date.now() + uploadTtlMs),
    });
    res.json(RequestUploadUrlResponse.parse({
      uploadURL: `/api/storage/uploads/${uploadId}/content`,
      objectPath,
    }));
  });

  router.put("/storage/uploads/:id/content", async (req, res): Promise<void> => {
    if (!req.authorization || !req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    const [pending] = await db.select().from(pendingUploadsTable).where(and(
      eq(pendingUploadsTable.id, req.params.id),
      eq(pendingUploadsTable.companyId, req.authorization.companyId),
      eq(pendingUploadsTable.userId, req.userId),
    ));
    if (!pending) { res.status(404).json({ error: "Carga pendiente no encontrada" }); return; }
    if (pending.expiresAt <= new Date()) { await deletePendingObject(pending); res.status(410).json({ error: "La carga expiró; solicita una nueva" }); return; }
    const contentLength = Number(req.header("content-length"));
    const contentType = String(req.header("content-type") ?? "").split(";")[0].trim();
    if (!Number.isSafeInteger(contentLength) || contentLength !== pending.size || contentType !== pending.contentType) {
      req.resume();
      res.status(400).json({ error: "El tipo o tamaño enviado no coincide con la carga autorizada" }); return;
    }
    const [reserved] = await db.update(pendingUploadsTable).set({ uploaded: true }).where(and(
      eq(pendingUploadsTable.id, pending.id),
      eq(pendingUploadsTable.uploaded, false),
    )).returning({ id: pendingUploadsTable.id });
    if (!reserved) { req.resume(); res.status(409).json({ error: "Esta carga ya fue utilizada" }); return; }
    try {
      await storage.uploadObject(storage.objectFile(pending.objectPath), req, pending.contentType, pending.size);
      res.sendStatus(204);
    } catch (error) {
      await db.delete(pendingUploadsTable).where(eq(pendingUploadsTable.id, pending.id));
      req.log.warn({ error, uploadId: pending.id }, "Rejected incomplete upload");
      if (!res.headersSent) res.status(400).json({ error: "La transferencia no coincide con el tamaño autorizado" });
    }
  });

  router.post("/attachments", async (req, res): Promise<void> => {
    if (!req.authorization || !req.userId || !can(req.authorization.role, "evidence")) { res.status(403).json({ error: "Forbidden" }); return; }
    const parsed = CreateAttachmentBody.safeParse(req.body);
    if (!parsed.success || !allowed.has(parsed.data?.contentType ?? "") || (parsed.data?.size ?? 0) > maxSize || (!!parsed.data?.incidentId === !!parsed.data?.contractId)) {
      res.status(400).json({ error: "El archivo o su destino no es válido" }); return;
    }
    const companyId = req.authorization.companyId;
    const parent = parsed.data.incidentId
      ? await db.select({ id: incidentsTable.id }).from(incidentsTable).where(and(eq(incidentsTable.id, parsed.data.incidentId), eq(incidentsTable.companyId, companyId)))
      : await db.select({ id: contractsTable.id }).from(contractsTable).where(and(eq(contractsTable.id, parsed.data.contractId!), eq(contractsTable.companyId, companyId)));
    if (!parent[0]) { res.status(404).json({ error: "El destino no pertenece a tu empresa" }); return; }
    const [pending] = await db.select().from(pendingUploadsTable).where(and(
      eq(pendingUploadsTable.objectPath, parsed.data.objectPath),
      eq(pendingUploadsTable.companyId, companyId),
      eq(pendingUploadsTable.userId, req.userId),
      eq(pendingUploadsTable.uploaded, true),
    ));
    if (!pending || pending.expiresAt <= new Date()) { res.status(409).json({ error: "La carga no está disponible o ya fue utilizada" }); return; }
    if (pending.fileName !== parsed.data.fileName || pending.contentType !== parsed.data.contentType || pending.size !== parsed.data.size) {
      res.status(400).json({ error: "Los datos del archivo no coinciden con la carga autorizada" }); return;
    }
    const [existing] = await db.select({ id: attachmentsTable.id }).from(attachmentsTable).where(eq(attachmentsTable.objectPath, parsed.data.objectPath));
    if (existing) { res.status(409).json({ error: "Esta carga ya fue utilizada" }); return; }
    const file = storage.objectFile(parsed.data.objectPath);
    const [exists] = await file.exists();
    if (!exists) { res.status(400).json({ error: "La carga no se completó" }); return; }
    const [metadata] = await file.getMetadata();
    const actualSize = Number(metadata.size ?? 0);
    const actualType = String(metadata.contentType ?? "");
    if (actualType !== pending.contentType || actualSize !== pending.size) {
      await deletePendingObject(pending);
      res.status(400).json({ error: "El contenido real del archivo no coincide con la carga autorizada" }); return;
    }
    const result = await db.transaction(async tx => {
      const [claim] = await tx.select().from(pendingUploadsTable).where(eq(pendingUploadsTable.id, pending.id)).for("update");
      if (!claim) return undefined;
      const [row] = await tx.insert(attachmentsTable).values({ id: `a${randomUUID().slice(0, 12)}`, companyId, uploadedBy: req.userId!, ...parsed.data }).returning();
      await tx.delete(pendingUploadsTable).where(eq(pendingUploadsTable.id, pending.id));
      if (parsed.data.contractId) {
        await tx.update(contractsTable).set({ evidenceCount: sql`${contractsTable.evidenceCount} + 1` }).where(and(eq(contractsTable.id, parsed.data.contractId), eq(contractsTable.companyId, companyId)));
        await tx.update(companyMetricsTable).set({ evidenceUploads: sql`${companyMetricsTable.evidenceUploads} + 1` }).where(eq(companyMetricsTable.companyId, companyId));
      }
      return row;
    });
    if (!result) { res.status(409).json({ error: "Esta carga ya fue utilizada" }); return; }
    res.status(201).json(CreateAttachmentResponse.parse(serializeAttachment(result)));
  });

  router.get("/attachments/:id/content", async (req, res): Promise<void> => {
    const parsed = GetAttachmentContentParams.safeParse(req.params);
    if (!parsed.success || !req.authorization) { res.status(404).json({ error: "Archivo no encontrado" }); return; }
    const [attachment] = await db.select().from(attachmentsTable).where(and(eq(attachmentsTable.id, parsed.data.id), eq(attachmentsTable.companyId, req.authorization.companyId)));
    if (!attachment) { res.status(404).json({ error: "Archivo no encontrado" }); return; }
    const object = await storage.streamObject(storage.objectFile(attachment.objectPath));
    res.setHeader("Content-Type", object.contentType);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`);
    if (object.size) res.setHeader("Content-Length", object.size);
    object.stream.on("error", error => { req.log.error({ error }, "Failed to stream attachment"); res.destroy(error); });
    object.stream.pipe(res);
  });

  router.delete("/attachments/:id", async (req, res): Promise<void> => {
    const parsed = DeleteAttachmentParams.safeParse(req.params);
    if (!parsed.success || !req.authorization || !req.userId) { res.status(404).json({ error: "Archivo no encontrado" }); return; }
    const [attachment] = await db.select().from(attachmentsTable).where(and(eq(attachmentsTable.id, parsed.data.id), eq(attachmentsTable.companyId, req.authorization.companyId)));
    if (!attachment) { res.status(404).json({ error: "Archivo no encontrado" }); return; }
    const canDelete = attachment.uploadedBy === req.userId || req.authorization.role !== "site_manager";
    if (!canDelete) { res.status(403).json({ error: "Solo quien subió el archivo o un responsable puede eliminarlo" }); return; }
    await db.transaction(async tx => {
      await tx.delete(attachmentsTable).where(and(eq(attachmentsTable.id, attachment.id), eq(attachmentsTable.companyId, req.authorization!.companyId)));
      if (attachment.contractId) await tx.update(contractsTable).set({ evidenceCount: sql`greatest(${contractsTable.evidenceCount} - 1, 0)` }).where(eq(contractsTable.id, attachment.contractId));
    });
    await storage.objectFile(attachment.objectPath).delete({ ignoreNotFound: true });
    res.sendStatus(204);
  });

  return router;
}

export default createAttachmentsRouter();