import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { eq } from "drizzle-orm";
import { db, membershipsTable } from "@workspace/db";
import { ensurePilotData } from "../lib/pilot-seed";

export type CompanyRole = "owner_manager" | "office" | "site_manager";
export type AuthorizationContext = { companyId: string; role: CompanyRole };
declare global {
  namespace Express {
    interface Request { sessionUserId?: string; userId?: string; authorization?: AuthorizationContext; }
  }
}

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <jwt>`.
 * It never rejects: routes decide what an anonymous request may do.
 */
export async function authenticateSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (token) {
    try {
      const { data, error } = await supabaseAdmin().auth.getClaims(token);
      const subject = data?.claims?.sub;
      if (!error && typeof subject === "string" && subject) req.sessionUserId = subject;
    } catch (error) {
      req.log?.warn({ err: error }, "Could not verify session token");
    }
  }
  next();
}

export function getSessionUserId(req: Request): string | null {
  return req.sessionUserId ?? null;
}

/** Resolves tenant authorization from a trusted authenticated user id. */
export async function resolveAuthorization(userId: string): Promise<AuthorizationContext | undefined> {
  const [membership] = await db.select().from(membershipsTable).where(eq(membershipsTable.clerkUserId, userId)).limit(1);
  if (!membership) return undefined;
  await ensurePilotData(membership.companyId);
  return { companyId: membership.companyId, role: membership.role };
}

/** Establishes identity and tenant context exclusively from the verified session + membership. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const candidate = getSessionUserId(req);
  if (typeof candidate !== "string" || !candidate) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = candidate;
  const authorization = await resolveAuthorization(userId);
  if (!authorization) {
    res.status(403).json({ error: "Tu cuenta todavía no pertenece a una empresa" }); return;
  }
  req.userId = userId;
  req.authorization = authorization;
  next();
}

export function requireRole(...roles: CompanyRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authorization || !roles.includes(req.authorization.role)) { res.status(403).json({ error: "Forbidden" }); return; }
    next();
  };
}