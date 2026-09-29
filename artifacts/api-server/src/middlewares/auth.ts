import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, membershipsTable } from "@workspace/db";
import { ensurePilotData } from "../lib/pilot-seed";

export type CompanyRole = "owner_manager" | "office" | "site_manager";
export type AuthorizationContext = { companyId: string; role: CompanyRole };
declare global {
  namespace Express {
    interface Request { userId?: string; authorization?: AuthorizationContext; }
  }
}

/** Resolves tenant authorization from a trusted authenticated user id. */
export async function resolveAuthorization(userId: string): Promise<AuthorizationContext | undefined> {
  const [membership] = await db.select().from(membershipsTable).where(eq(membershipsTable.clerkUserId, userId)).limit(1);
  if (!membership) return undefined;
  await ensurePilotData(membership.companyId);
  return { companyId: membership.companyId, role: membership.role };
}

/** Establishes identity and tenant context exclusively from Clerk + membership. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const candidate = auth?.userId;
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