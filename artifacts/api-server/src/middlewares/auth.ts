import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { auth } from "@workspace/auth";
import { db, membershipsTable } from "@workspace/db";
import { ensurePilotData } from "../lib/pilot-seed";

export type CompanyRole = "owner_manager" | "office" | "site_manager";
export type AuthorizationContext = { companyId: string; role: CompanyRole };
declare global {
  namespace Express {
    interface Request {
      sessionUserId?: string;
      sessionUserEmail?: string;
      userId?: string;
      authorization?: AuthorizationContext;
    }
  }
}

function requestHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  return headers;
}

export async function authenticateSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.headers.cookie) {
    next();
    return;
  }
  try {
    const session = await auth.api.getSession({ headers: requestHeaders(req) });
    if (session?.user?.id) {
      req.sessionUserId = session.user.id;
      req.sessionUserEmail = session.user.email;
    }
  } catch (error) {
    req.log?.warn({ err: error }, "Could not verify Better Auth session");
  }
  next();
}

export function getSessionUserId(req: Request): string | null {
  return req.sessionUserId ?? null;
}

export async function resolveAuthorization(userId: string): Promise<AuthorizationContext | undefined> {
  const [membership] = await db.select().from(membershipsTable).where(eq(membershipsTable.clerkUserId, userId)).limit(1);
  if (!membership) return undefined;
  await ensurePilotData(membership.companyId);
  return { companyId: membership.companyId, role: membership.role };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const candidate = getSessionUserId(req);
  if (typeof candidate !== "string" || !candidate) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const authorization = await resolveAuthorization(candidate);
  if (!authorization) {
    res.status(403).json({ error: "Tu cuenta todavía no pertenece a una empresa" });
    return;
  }
  req.userId = candidate;
  req.authorization = authorization;
  next();
}

export function requireRole(...roles: CompanyRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authorization || !roles.includes(req.authorization.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
