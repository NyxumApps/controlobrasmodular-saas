import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { getSessionUserId } from "../middlewares/auth";
import { eq, sql } from "drizzle-orm";
import { db, companiesTable, membershipsTable } from "@workspace/db";
import { OnboardCompanyBody } from "@workspace/api-zod";
import { ensurePilotData } from "../lib/pilot-seed";

const router: IRouter = Router();

router.post("/onboarding/company", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = OnboardCompanyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Ingresa el nombre de tu empresa" }); return; }
  const name = parsed.data.name.trim();
  if (!name) { res.status(400).json({ error: "Ingresa el nombre de tu empresa" }); return; }

  const result = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [existing] = await tx.select().from(membershipsTable).where(eq(membershipsTable.clerkUserId, userId)).limit(1);
    if (existing) return { error: "already_member" as const };
    const companyId = `company-${randomUUID()}`;
    await tx.insert(companiesTable).values({ id: companyId, name });
    const [membership] = await tx.insert(membershipsTable).values({
      id: `membership-${randomUUID()}`,
      companyId,
      clerkUserId: userId,
      role: "owner_manager",
    }).returning();
    return { companyId, membership };
  });

  if ("error" in result) { res.status(409).json({ error: "Tu cuenta ya pertenece a una empresa" }); return; }
  await ensurePilotData(result.companyId);
  res.status(201).json({ companyId: result.companyId, role: result.membership.role });
});

export default router;