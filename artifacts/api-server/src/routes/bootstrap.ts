import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, worksTable, budgetItemsTable, expensesTable, incidentsTable, subcontractorsTable, contractsTable, attachmentsTable, commitmentsTable, companySettingsTable, companyMetricsTable, addressedCostAlertsTable, companiesTable, membershipsTable, companyInvitationsTable } from "@workspace/db";
import { GetBootstrapResponse } from "@workspace/api-zod";
import { serializeAttachment, serializeIncident } from "../lib/api-serialization";

const router: IRouter = Router();
router.get("/bootstrap", async (req, res): Promise<void> => {
  const context = req.authorization;
  if (!context || !req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const companyId = context.companyId;
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId));
  const [settings] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.companyId, companyId));
  const [metrics] = await db.select().from(companyMetricsTable).where(eq(companyMetricsTable.companyId, companyId));
  const [members, invitations, works, budgetItems, expenses, incidents, subcontractors, contracts, attachments, commitments, alerts] = await Promise.all([
    db.select({ id: membershipsTable.id, clerkUserId: membershipsTable.clerkUserId, role: membershipsTable.role }).from(membershipsTable).where(eq(membershipsTable.companyId, companyId)),
    db.select({
      id: companyInvitationsTable.id,
      email: companyInvitationsTable.email,
      role: companyInvitationsTable.role,
      status: companyInvitationsTable.status,
      expiresAt: companyInvitationsTable.expiresAt,
      createdAt: companyInvitationsTable.createdAt,
    }).from(companyInvitationsTable).where(eq(companyInvitationsTable.companyId, companyId)),
    db.select().from(worksTable).where(eq(worksTable.companyId, companyId)),
    db.select().from(budgetItemsTable).where(eq(budgetItemsTable.companyId, companyId)),
    db.select().from(expensesTable).where(eq(expensesTable.companyId, companyId)),
    db.select().from(incidentsTable).where(eq(incidentsTable.companyId, companyId)),
    db.select().from(subcontractorsTable).where(eq(subcontractorsTable.companyId, companyId)),
    db.select().from(contractsTable).where(eq(contractsTable.companyId, companyId)),
    db.select({ id: attachmentsTable.id, incidentId: attachmentsTable.incidentId, contractId: attachmentsTable.contractId, fileName: attachmentsTable.fileName, contentType: attachmentsTable.contentType, size: attachmentsTable.size, uploadedBy: attachmentsTable.uploadedBy, createdAt: attachmentsTable.createdAt }).from(attachmentsTable).where(eq(attachmentsTable.companyId, companyId)),
    db.select().from(commitmentsTable).where(eq(commitmentsTable.companyId, companyId)),
    db.select().from(addressedCostAlertsTable).where(eq(addressedCostAlertsTable.companyId, companyId)),
  ]);
  const now = Date.now();
  const serializedInvitations = invitations.map(invitation => ({
    ...invitation,
    status: invitation.status === "pending" && invitation.expiresAt.getTime() <= now ? "expired" as const : invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  }));
  const payload = { user: { id: req.userId }, company: company ?? { id: companyId, name: "" }, role: context.role, members, invitations: context.role === "owner_manager" ? serializedInvitations : [], works, budgetItems, expenses, incidents: incidents.map(serializeIncident), subcontractors, contracts, attachments: attachments.map(serializeAttachment), commitments, addressedCostAlerts: alerts.map(a => a.budgetItemId), settings: settings ?? { profitability: true, communications: true, subcontractors: true }, metrics: metrics ?? { worksCreated: 0, worksReviewed: 0, expensesRegistered: 0, costAlertsActedOn: 0, incidencesCreated: 0, incidencesResolved: 0, evidenceUploads: 0, paymentApprovals: 0, moduleChanges: 0 } };
  res.json(GetBootstrapResponse.parse(payload));
});
export default router;
