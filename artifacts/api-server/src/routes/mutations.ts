import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, worksTable, expensesTable, budgetItemsTable, incidentsTable, contractsTable, companiesTable, membershipsTable, companySettingsTable, companyMetricsTable, addressedCostAlertsTable, auditEventsTable } from "@workspace/db";
import { CreateWorkBody, CreateExpenseBody, CreateIncidentBody, ChangeIncidentStatusBody, ChangeIncidentStatusParams, ApproveContractPaymentBody, ApproveContractPaymentParams, UpdateCompanyNameBody, UpdateMemberRoleBody, UpdateMemberRoleParams, ToggleModuleBody, MarkCostAlertAddressedParams, IncrementWorkReviewedParams } from "@workspace/api-zod";
import { can } from "../lib/authorization-policy";
import { serializeIncident } from "../lib/api-serialization";
import { belongsToCompany, budgetItemBelongsToWork } from "../lib/tenant-integrity";
import { canDemoteOwner, isValidPayment } from "../lib/authorization-integrity";

const router: IRouter = Router();
const deny = (req: any, res: any, permission: any): boolean => { if (!req.authorization || !can(req.authorization.role, permission)) { res.status(403).json({ error: "Forbidden" }); return true; } return false; };
const id = (prefix: string) => `${prefix}${randomUUID().slice(0, 12)}`;
const audit = (companyId: string, actorUserId: string, action: string, targetId: string, details: Record<string, unknown>) => ({
  id: id("audit-"), companyId, actorUserId, action, targetId, details,
});

router.post("/works", async (req, res): Promise<void> => {
  if (deny(req, res, "create_work")) return;
  const parsed = CreateWorkBody.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const value = { ...parsed.data, id: id("w"), companyId: req.authorization!.companyId, status: "planificación" as const, progress: 0, manager: parsed.data.manager || "" };
  const [row] = await db.insert(worksTable).values(value).returning(); await db.update(companyMetricsTable).set({ worksCreated: sql`${companyMetricsTable.worksCreated} + 1` }).where(eq(companyMetricsTable.companyId, value.companyId)); res.status(201).json(row);
});
router.post("/expenses", async (req, res): Promise<void> => {
  if (deny(req, res, "expense")) return;
  const parsed = CreateExpenseBody.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const companyId = req.authorization!.companyId;
  const [parent] = await db.select({ companyId: budgetItemsTable.companyId, workId: budgetItemsTable.workId }).from(budgetItemsTable).where(eq(budgetItemsTable.id, parsed.data.itemId));
  if (!budgetItemBelongsToWork(parent, companyId, parsed.data.workId)) { res.status(404).json({ error: "La obra o partida no pertenece a tu empresa" }); return; }
  const row = await db.transaction(async tx => { const [expense] = await tx.insert(expensesTable).values({ ...parsed.data, id: id("e"), companyId } as any).returning(); await tx.update(budgetItemsTable).set({ spent: sql`${budgetItemsTable.spent} + ${parsed.data.amount}` }).where(and(eq(budgetItemsTable.id, parsed.data.itemId), eq(budgetItemsTable.companyId, companyId))); await tx.update(companyMetricsTable).set({ expensesRegistered: sql`${companyMetricsTable.expensesRegistered} + 1` }).where(eq(companyMetricsTable.companyId, companyId)); return expense; }); res.status(201).json(row);
});
router.post("/incidents", async (req, res): Promise<void> => {
  if (deny(req, res, "incident")) return; const parsed = CreateIncidentBody.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const companyId = req.authorization!.companyId;
  const [work] = await db.select({ companyId: worksTable.companyId }).from(worksTable).where(eq(worksTable.id, parsed.data.workId));
  if (!belongsToCompany(work, companyId)) { res.status(404).json({ error: "La obra no pertenece a tu empresa" }); return; }
  const [row] = await db.insert(incidentsTable).values({ ...parsed.data, id: id("i"), companyId, status: "abierto" as const } as any).returning(); await db.update(companyMetricsTable).set({ incidencesCreated: sql`${companyMetricsTable.incidencesCreated} + 1` }).where(eq(companyMetricsTable.companyId, companyId)); res.status(201).json(serializeIncident(row));
});
router.patch("/incidents/:id/status", async (req, res): Promise<void> => {
  if (deny(req, res, "incident_status")) return; const p = ChangeIncidentStatusParams.safeParse(req.params), b = ChangeIncidentStatusBody.safeParse(req.body); if (!p.success || !b.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const companyId = req.authorization!.companyId;
  const [before] = await db.select().from(incidentsTable).where(and(eq(incidentsTable.id, p.data.id), eq(incidentsTable.companyId, companyId)));
  if (!before) { res.status(404).json({ error: "Incident not found" }); return; }
  const [row] = await db.update(incidentsTable).set({ status: b.data.status }).where(and(eq(incidentsTable.id, p.data.id), eq(incidentsTable.companyId, companyId))).returning();
  if (before.status !== b.data.status && (before.status === "resuelto" || b.data.status === "resuelto")) await db.update(companyMetricsTable).set({ incidencesResolved: sql`${companyMetricsTable.incidencesResolved} + ${b.data.status === "resuelto" ? 1 : -1}` }).where(eq(companyMetricsTable.companyId, companyId));
  res.json(row);
});
router.patch("/contracts/:id/payment", async (req, res): Promise<void> => {
  if (deny(req, res, "approve_payment")) return; const p = ApproveContractPaymentParams.safeParse(req.params), b = ApproveContractPaymentBody.safeParse(req.body); if (!p.success || !b.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const companyId = req.authorization!.companyId;
  const result = await db.transaction(async tx => {
    const [contract] = await tx.select().from(contractsTable).where(and(eq(contractsTable.id, p.data.id), eq(contractsTable.companyId, companyId))).for("update");
    if (!contract) return { error: "not_found" as const };
    if (!isValidPayment(b.data.amount, contract.pendingPayment)) return { error: "invalid_amount" as const };
    const [updated] = await tx.update(contractsTable).set({ approvedPaid: contract.approvedPaid + b.data.amount, pendingPayment: contract.pendingPayment - b.data.amount }).where(and(eq(contractsTable.id, p.data.id), eq(contractsTable.companyId, companyId))).returning();
    await tx.update(companyMetricsTable).set({ paymentApprovals: sql`${companyMetricsTable.paymentApprovals} + 1` }).where(eq(companyMetricsTable.companyId, companyId));
    await tx.insert(auditEventsTable).values(audit(companyId, req.userId!, "payment.approved", contract.id, { amount: b.data.amount }));
    return { updated };
  });
  if ("error" in result) { res.status(result.error === "not_found" ? 404 : 400).json({ error: result.error === "not_found" ? "Contract not found" : "El monto debe ser positivo y no superar el saldo pendiente" }); return; }
  res.json(result.updated);
});
router.patch("/company", async (req, res): Promise<void> => { if (deny(req, res, "company_settings")) return; const b = UpdateCompanyNameBody.safeParse(req.body); if (!b.success) { res.status(400).json({ error: b.error.message }); return; } const [row] = await db.update(companiesTable).set({ name: b.data.name }).where(eq(companiesTable.id, req.authorization!.companyId)).returning(); res.json(row); });
router.patch("/members/:id/role", async (req, res): Promise<void> => {
  if (deny(req, res, "member_roles")) return;
  const p = UpdateMemberRoleParams.safeParse(req.params), b = UpdateMemberRoleBody.safeParse(req.body);
  if (!p.success || !b.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const companyId = req.authorization!.companyId;
  const result = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${companyId}))`);
    const [target] = await tx.select().from(membershipsTable).where(and(eq(membershipsTable.id, p.data.id), eq(membershipsTable.companyId, companyId)));
    if (!target) return { error: "not_found" as const };
    const owners = await tx.select({ id: membershipsTable.id }).from(membershipsTable).where(and(eq(membershipsTable.companyId, companyId), eq(membershipsTable.role, "owner_manager")));
    if (!canDemoteOwner(target.role, b.data.role, owners.length)) return { error: "last_owner" as const };
    const [updated] = await tx.update(membershipsTable).set({ role: b.data.role }).where(and(eq(membershipsTable.id, p.data.id), eq(membershipsTable.companyId, companyId))).returning();
    if (target.role !== b.data.role) await tx.insert(auditEventsTable).values(audit(companyId, req.userId!, "member.role_changed", target.id, { fromRole: target.role, toRole: b.data.role, targetUserId: target.clerkUserId }));
    return { updated };
  });
  if ("error" in result) { res.status(result.error === "not_found" ? 404 : 409).json({ error: result.error === "not_found" ? "Member not found" : "La empresa debe conservar al menos un Dueño/Gerente" }); return; }
  res.json(result.updated);
});
router.patch("/settings/modules", async (req, res): Promise<void> => {
  if (deny(req, res, "modules")) return; const b = ToggleModuleBody.safeParse(req.body); if (!b.success) { res.status(400).json({ error: b.error.message }); return; }
  const companyId = req.authorization!.companyId;
  const row = await db.transaction(async tx => {
    const [settings] = await tx.select().from(companySettingsTable).where(eq(companySettingsTable.companyId, companyId)).for("update");
    if (!settings) return undefined;
    const col = b.data.module === "profitability" ? companySettingsTable.profitability : b.data.module === "communications" ? companySettingsTable.communications : companySettingsTable.subcontractors;
    const [updated] = await tx.update(companySettingsTable).set({ [col.name]: b.data.enabled }).where(eq(companySettingsTable.companyId, companyId)).returning();
    if (settings[b.data.module] !== b.data.enabled) {
      await tx.update(companyMetricsTable).set({ moduleChanges: sql`${companyMetricsTable.moduleChanges} + 1` }).where(eq(companyMetricsTable.companyId, companyId));
      await tx.insert(auditEventsTable).values(audit(companyId, req.userId!, "module.changed", b.data.module, { module: b.data.module, enabled: b.data.enabled }));
    }
    return updated;
  });
  if (!row) { res.status(404).json({ error: "Company settings not found" }); return; }
  res.json(row);
});
router.post("/cost-alerts/:id/address", async (req, res): Promise<void> => {
  if (deny(req, res, "cost_alert")) return; const p = MarkCostAlertAddressedParams.safeParse(req.params); if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const companyId = req.authorization!.companyId;
  const [item] = await db.select({ id: budgetItemsTable.id }).from(budgetItemsTable).where(and(eq(budgetItemsTable.id, p.data.id), eq(budgetItemsTable.companyId, companyId)));
  if (!item) { res.status(404).json({ error: "Budget item not found" }); return; }
  await db.transaction(async tx => {
    const [inserted] = await tx.insert(addressedCostAlertsTable).values({ companyId, budgetItemId: p.data.id }).onConflictDoNothing().returning();
    if (inserted) {
      await tx.update(companyMetricsTable).set({ costAlertsActedOn: sql`${companyMetricsTable.costAlertsActedOn} + 1` }).where(eq(companyMetricsTable.companyId, companyId));
      await tx.insert(auditEventsTable).values(audit(companyId, req.userId!, "cost_alert.addressed", p.data.id, {}));
    }
  });
  res.sendStatus(204);
});
router.post("/works/:id/review", async (req, res): Promise<void> => { if (deny(req, res, "work_review")) return; const p = IncrementWorkReviewedParams.safeParse(req.params); if (!p.success) { res.status(400).json({ error: p.error.message }); return; } const [work] = await db.select({ id: worksTable.id }).from(worksTable).where(and(eq(worksTable.id, p.data.id), eq(worksTable.companyId, req.authorization!.companyId))); if (!work) { res.status(404).json({ error: "Work not found" }); return; } await db.update(companyMetricsTable).set({ worksReviewed: sql`${companyMetricsTable.worksReviewed} + 1` }).where(eq(companyMetricsTable.companyId, req.authorization!.companyId)); res.sendStatus(204); });
export default router;