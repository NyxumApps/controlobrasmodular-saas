import { randomBytes, randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type RequestHandler } from "express";
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
import { getSessionUserId, requireAuth } from "../middlewares/auth";
import { can } from "../lib/authorization-policy";
import { getRequestHostWithPort } from "../middlewares/allowedHost";
import { supabaseAdmin } from "../lib/supabase";

type InvitationRouterDependencies = {
  getUserId: (req: Request) => string | null;
  getVerifiedEmails: (userId: string) => Promise<string[]>;
  seedCompany: (companyId: string) => Promise<void>;
  authenticate: RequestHandler;
  sendInvitationEmail: (input: { emailAddress: string; redirectUrl: string }) => Promise<void>;
};

/**
 * New people receive Supabase's invitation email; people who already have an
 * account receive a sign-in link. Both land on /invite/{token}, and that token
 * (stored only as a hash) is what actually grants the membership.
 */
async function sendSupabaseInvitation(input: { emailAddress: string; redirectUrl: string }): Promise<void> {
  const auth = supabaseAdmin().auth;
  const invited = await auth.admin.inviteUserByEmail(input.emailAddress, { redirectTo: input.redirectUrl });
  if (!invited.error) return;
  if (invited.error.code !== "email_exists" && invited.error.status !== 422) throw invited.error;
  const link = await auth.signInWithOtp({
    email: input.emailAddress,
    options: { shouldCreateUser: false, emailRedirectTo: input.redirectUrl },
  });
  if (link.error) throw link.error;
}

const defaultDependencies: InvitationRouterDependencies = {
  getUserId: getSessionUserId,
  getVerifiedEmails: async userId => {
    const { data, error } = await supabaseAdmin().auth.admin.getUserById(userId);
    if (error) throw error;
    const user = data.user;
    return user?.email && user.email_confirmed_at ? [user.email] : [];
  },
  seedCompany: ensurePilotData,
  authenticate: requireAuth,
  sendInvitationEmail: sendSupabaseInvitation,
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
  const host = getRequestHostWithPort(req);
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
    await dependencies.sendInvitationEmail({ emailAddress: email, redirectUrl });
    res.status(201).json(serializeInvitation(reservation.row));
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
  res.json(serializeInvitation(result.revoked));
});

router.post("/invitations/:id/resend", dependencies.authenticate, async (req, res): Promise<void> => {
  if (!req.authorization || !can(req.authorization.role, "member_roles")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = ResendInvitationParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "La invitación no es válida" }); return; }
  const host = getRequestHostWithPort(req);
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
  try {
    await dependencies.sendInvitationEmail({
      emailAddress: reservation.row.email,
      redirectUrl: `${invitationOrigin(host)}/invite/${token}`,
    });
    const [row] = await db.transaction(async tx => {
      const [current] = await tx.select().from(companyInvitationsTable).where(and(
        eq(companyInvitationsTable.id, newInvitationId),
        eq(companyInvitationsTable.status, "pending"),
      )).limit(1);
      if (!current) return [];
      await tx.insert(auditEventsTable).values(invitationAuditEvent(
        current.companyId,
        req.userId!,
        "invitation.resent",
        parsed.data.id,
        current.email,
        { replacementInvitationId: current.id },
      ));
      return [current];
    });
    if (!row) throw new Error("Invitation reservation disappeared before it could be confirmed");
    res.status(201).json(serializeInvitation(row));
  } catch (error) {
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