import { randomBytes, randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { and, eq, gt, sql } from "drizzle-orm";
import { auditEventsTable, db, companyInvitationsTable, membershipsTable } from "@workspace/db";
import {
  AcceptInvitationBody,
  CreateInvitationBody,
  ResendInvitationParams,
  RevokeInvitationParams,
} from "@workspace/api-zod";
import { emailMatchesInvitation, hashInvitationToken, invitationOrigin, normalizeEmail } from "../lib/invitation-security";
import { ensurePilotData } from "../lib/pilot-seed";
import { requireAuth } from "../middlewares/auth";
import { can } from "../lib/authorization-policy";
import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware";

type InvitationRouterDependencies = {
  getUserId: (req: Request) => string | null;
  getVerifiedEmails: (userId: string) => Promise<string[]>;
  seedCompany: (companyId: string) => Promise<void>;
  authenticate: RequestHandler;
  createClerkInvitation: (input: {
    emailAddress: string;
    expiresInDays: number;
    ignoreExisting: boolean;
    notify: boolean;
    redirectUrl: string;
  }) => Promise<{ id: string }>;
  revokeClerkInvitation: (id: string) => Promise<unknown>;
};

const defaultDependencies: InvitationRouterDependencies = {
  getUserId: req => getAuth(req).userId,
  getVerifiedEmails: async userId => {
    const user = await clerkClient.users.getUser(userId);
    return user.emailAddresses
      .filter(address => address.verification?.status === "verified")
      .map(address => address.emailAddress);
  },
  seedCompany: ensurePilotData,
  authenticate: requireAuth,
  createClerkInvitation: input => clerkClient.invitations.createInvitation(input),
  revokeClerkInvitation: id => clerkClient.invitations.revokeInvitation(id),
};

export function createInvitationsRouter(
  dependencies: InvitationRouterDependencies = defaultDependencies,
): IRouter {
const router: IRouter = Router();
const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const invitationAuditEvent = (
  companyId: string,
  actorUserId: string,
  action: "invitation.revoked" | "invitation.resent",
  invitationId: string,
  email: string,
  details: Record<string, unknown> = {},
) => ({
  id: `audit-${randomUUID()}`,
  companyId,
  actorUserId,
  action,
  targetId: invitationId,
  details: { email, ...details },
});

const serializeInvitation = (invitation: typeof companyInvitationsTable.$inferSelect) => ({
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  status: invitation.status,
  expiresAt: invitation.expiresAt.toISOString(),
  createdAt: invitation.createdAt.toISOString(),
});

router.post("/invitations", dependencies.authenticate, async (req, res): Promise<void> => {
  if (!req.authorization || !can(req.authorization.role, "member_roles")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = CreateInvitationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Ingresa un correo válido y selecciona un rol" }); return; }
  const companyId = req.authorization.companyId;
  const email = normalizeEmail(parsed.data.email);
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + invitationLifetimeMs);
  const invitationId = `invitation-${randomUUID()}`;
  const host = getClerkProxyHost(req);
  if (!host) { res.status(400).json({ error: "No se pudo validar el destino de la invitación" }); return; }
  const redirectUrl = `${invitationOrigin(host)}/invite/${token}`;
  const reservation = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${companyId}:${email}`}))`);
    const [pending] = await tx.select({ id: companyInvitationsTable.id }).from(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.companyId, companyId),
      eq(companyInvitationsTable.email, email),
      eq(companyInvitationsTable.status, "pending"),
      gt(companyInvitationsTable.expiresAt, now),
    )).limit(1);
    if (pending) return { error: "already_pending" as const };
    const [row] = await tx.insert(companyInvitationsTable).values({
      id: invitationId,
      companyId,
      email,
      role: parsed.data.role,
      tokenHash: hashInvitationToken(token),
      invitedByClerkUserId: req.userId!,
      expiresAt,
    }).returning();
    return { row };
  });
  if ("error" in reservation) { res.status(409).json({ error: "Ya existe una invitación vigente para este correo" }); return; }
  try {
    const clerkInvitation = await dependencies.createClerkInvitation({
      emailAddress: email,
      expiresInDays: 7,
      ignoreExisting: true,
      notify: true,
      redirectUrl,
    });
    const [row] = await db.update(companyInvitationsTable)
      .set({ clerkInvitationId: clerkInvitation.id })
      .where(eq(companyInvitationsTable.id, invitationId))
      .returning();
    res.status(201).json(serializeInvitation(row));
  } catch (error) {
    await db.delete(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.id, invitationId),
      eq(companyInvitationsTable.status, "pending"),
    ));
    req.log.error({ err: error }, "Failed to create teammate invitation");
    res.status(502).json({ error: "No se pudo enviar la invitación. Intenta de nuevo." });
  }
});

router.delete("/invitations/:id", dependencies.authenticate, async (req, res): Promise<void> => {
  if (!req.authorization || !can(req.authorization.role, "member_roles")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = RevokeInvitationParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "La invitación no es válida" }); return; }
  const now = new Date();
  const result = await db.transaction(async tx => {
    const [invitation] = await tx.select().from(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.id, parsed.data.id),
      eq(companyInvitationsTable.companyId, req.authorization!.companyId),
    )).limit(1).for("update");
    if (!invitation) return { error: "not_found" as const };
    if (invitation.status !== "pending" || invitation.expiresAt <= now) return { error: "not_pending" as const };
    const [revoked] = await tx.update(companyInvitationsTable).set({ status: "revoked" }).where(and(
      eq(companyInvitationsTable.id, invitation.id),
      eq(companyInvitationsTable.status, "pending"),
    )).returning();
    await tx.insert(auditEventsTable).values(invitationAuditEvent(
      invitation.companyId,
      req.userId!,
      "invitation.revoked",
      invitation.id,
      invitation.email,
    ));
    return { revoked };
  });
  if ("error" in result) {
    res.status(result.error === "not_found" ? 404 : 409).json({
      error: result.error === "not_found" ? "Invitación no encontrada" : "Solo se puede cancelar una invitación pendiente",
    });
    return;
  }
  try {
    if (result.revoked.clerkInvitationId) {
      await dependencies.revokeClerkInvitation(result.revoked.clerkInvitationId);
    }
    res.json(serializeInvitation(result.revoked));
  } catch (error) {
    const retryAt = new Date(Date.now() + 60_000);
    await db.update(companyInvitationsTable).set({
      clerkRevocationPending: true,
      clerkRevocationAttempts: 1,
      clerkRevocationNextAttemptAt: retryAt,
      clerkRevocationLastError: "Initial Clerk revocation failed",
    }).where(eq(companyInvitationsTable.id, result.revoked.id));
    req.log.error({ err: error, invitationId: result.revoked.id }, "Failed to revoke Clerk teammate invitation");
    res.status(502).json({ error: "La invitación quedó cancelada en ObraControl, pero Clerk no confirmó la cancelación" });
  }
});

router.post("/invitations/:id/resend", dependencies.authenticate, async (req, res): Promise<void> => {
  if (!req.authorization || !can(req.authorization.role, "member_roles")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = ResendInvitationParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "La invitación no es válida" }); return; }
  const host = getClerkProxyHost(req);
  if (!host) { res.status(400).json({ error: "No se pudo validar el destino de la invitación" }); return; }
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + invitationLifetimeMs);
  const newInvitationId = `invitation-${randomUUID()}`;
  const reservation = await db.transaction(async tx => {
    const companyId = req.authorization!.companyId;
    const [invitation] = await tx.select().from(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.id, parsed.data.id),
      eq(companyInvitationsTable.companyId, companyId),
    )).limit(1).for("update");
    if (!invitation) return { error: "not_found" as const };
    const expired = invitation.status === "pending" && invitation.expiresAt <= now;
    if (invitation.status !== "revoked" && !expired) return { error: "not_resendable" as const };
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${companyId}:${invitation.email}`}))`);
    const [pendingReplacement] = await tx.select({ id: companyInvitationsTable.id })
      .from(companyInvitationsTable)
      .where(and(
        eq(companyInvitationsTable.companyId, companyId),
        eq(companyInvitationsTable.email, invitation.email),
        eq(companyInvitationsTable.status, "pending"),
        gt(companyInvitationsTable.expiresAt, now),
      ))
      .limit(1);
    if (pendingReplacement) return { error: "already_pending" as const };
    if (expired) {
      await tx.update(companyInvitationsTable).set({ status: "revoked" }).where(eq(companyInvitationsTable.id, invitation.id));
    }
    const [row] = await tx.insert(companyInvitationsTable).values({
      id: newInvitationId,
      companyId: invitation.companyId,
      email: invitation.email,
      role: invitation.role,
      tokenHash: hashInvitationToken(token),
      invitedByClerkUserId: req.userId!,
      expiresAt,
    }).returning();
    return { row };
  });
  if ("error" in reservation) {
    res.status(reservation.error === "not_found" ? 404 : 409).json({
      error: reservation.error === "not_found"
        ? "Invitación no encontrada"
        : reservation.error === "already_pending"
          ? "Ya existe una invitación de reemplazo vigente para este correo"
          : "Solo se pueden reenviar invitaciones vencidas o canceladas",
    });
    return;
  }
  let newClerkInvitationId: string | undefined;
  try {
    const clerkInvitation = await dependencies.createClerkInvitation({
      emailAddress: reservation.row.email,
      expiresInDays: 7,
      ignoreExisting: true,
      notify: true,
      redirectUrl: `${invitationOrigin(host)}/invite/${token}`,
    });
    newClerkInvitationId = clerkInvitation.id;
    const [row] = await db.transaction(async tx => {
      const [updated] = await tx.update(companyInvitationsTable)
        .set({ clerkInvitationId: clerkInvitation.id })
        .where(and(
          eq(companyInvitationsTable.id, newInvitationId),
          eq(companyInvitationsTable.status, "pending"),
        ))
        .returning();
      if (!updated) return [];
      await tx.insert(auditEventsTable).values(invitationAuditEvent(
        updated.companyId,
        req.userId!,
        "invitation.resent",
        parsed.data.id,
        updated.email,
        { replacementInvitationId: updated.id },
      ));
      return [updated];
    });
    if (!row) throw new Error("Invitation reservation disappeared before Clerk synchronization");
    res.status(201).json(serializeInvitation(row));
  } catch (error) {
    if (newClerkInvitationId) {
      try {
        await dependencies.revokeClerkInvitation(newClerkInvitationId);
      } catch (cleanupError) {
        req.log.error({ err: cleanupError, clerkInvitationId: newClerkInvitationId }, "Failed to clean up resent Clerk invitation");
      }
    }
    await db.delete(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.id, newInvitationId),
      eq(companyInvitationsTable.status, "pending"),
    ));
    req.log.error({ err: error }, "Failed to resend teammate invitation");
    res.status(502).json({ error: "No se pudo reenviar la invitación. Intenta de nuevo." });
  }
});

router.post("/invitations/accept", async (req, res): Promise<void> => {
  const userId = dependencies.getUserId(req);
  if (!userId) { res.status(401).json({ error: "Inicia sesión para aceptar la invitación" }); return; }
  const parsed = AcceptInvitationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "La invitación no es válida" }); return; }

  const verifiedEmails = await dependencies.getVerifiedEmails(userId);
  const tokenHash = hashInvitationToken(parsed.data.token);
  const result = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tokenHash}))`);
    const [invitation] = await tx.select().from(companyInvitationsTable)
      .where(and(
        eq(companyInvitationsTable.tokenHash, tokenHash),
        eq(companyInvitationsTable.status, "pending"),
        gt(companyInvitationsTable.expiresAt, new Date()),
      )).limit(1);
    if (!invitation) return { error: "invalid" as const };
    if (!emailMatchesInvitation(invitation.email, verifiedEmails)) return { error: "wrong_account" as const };
    const [existing] = await tx.select().from(membershipsTable)
      .where(eq(membershipsTable.clerkUserId, userId)).limit(1);
    if (existing) return { error: "already_member" as const };
    await tx.insert(membershipsTable).values({
      id: `membership-${randomUUID()}`,
      companyId: invitation.companyId,
      clerkUserId: userId,
      role: invitation.role,
    });
    await tx.update(companyInvitationsTable).set({
      status: "accepted",
      acceptedByClerkUserId: userId,
      acceptedAt: new Date(),
    }).where(and(
      eq(companyInvitationsTable.id, invitation.id),
      eq(companyInvitationsTable.status, "pending"),
    ));
    return { companyId: invitation.companyId, role: invitation.role };
  });

  if ("error" in result) {
    const messages = {
      invalid: "La invitación venció, ya fue utilizada o no existe",
      wrong_account: "Esta invitación fue enviada a otra cuenta de correo",
      already_member: "Tu cuenta ya pertenece a una empresa",
    };
    res.status(409).json({ error: messages[result.error!] });
    return;
  }
  await dependencies.seedCompany(result.companyId);
  res.json(result);
});

return router;
}

export default createInvitationsRouter();