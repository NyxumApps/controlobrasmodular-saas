import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { auditEventsTable, db } from "@workspace/db";
import { ListAuditEventsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/audit-events", async (req, res): Promise<void> => {
  const context = req.authorization;
  if (!context || context.role !== "owner_manager") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await db.select({
    id: auditEventsTable.id,
    actorUserId: auditEventsTable.actorUserId,
    action: auditEventsTable.action,
    targetId: auditEventsTable.targetId,
    details: auditEventsTable.details,
    createdAt: auditEventsTable.createdAt,
  }).from(auditEventsTable)
    .where(eq(auditEventsTable.companyId, context.companyId))
    .orderBy(desc(auditEventsTable.createdAt))
    .limit(50);
  res.json(ListAuditEventsResponse.parse(rows));
});

export default router;