import {
  boolean, date, index, integer, jsonb, pgEnum, pgTable, primaryKey,
  text, timestamp, uniqueIndex, varchar,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["owner_manager", "office", "site_manager"]);

export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "revoked"]);
export const workStatus = pgEnum("work_status", ["planificación", "en curso", "pausada", "completada"]);
export const incidentStatus = pgEnum("incident_status", ["abierto", "en proceso", "resuelto"]);
export const incidentPriority = pgEnum("incident_priority", ["alta", "media", "baja"]);
export const expenseType = pgEnum("expense_type", ["material", "mano_obra", "equipo", "subcontrato", "otro"]);
export const subcontractorStatus = pgEnum("subcontractor_status", ["activo", "inactivo"]);

export const companiesTable = pgTable("companies", {
  id: varchar("id", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const membershipsTable = pgTable("memberships", {
  id: varchar("id", { length: 100 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  clerkUserId: varchar("clerk_user_id", { length: 128 }).notNull(),
  role: membershipRole("role").notNull().default("site_manager"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("memberships_clerk_user_uq").on(t.clerkUserId), index("memberships_company_idx").on(t.companyId)]);

export const companyInvitationsTable = pgTable("company_invitations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: membershipRole("role").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  clerkInvitationId: varchar("clerk_invitation_id", { length: 128 }),
  clerkRevocationPending: boolean("clerk_revocation_pending").notNull().default(false),
  clerkRevocationAttempts: integer("clerk_revocation_attempts").notNull().default(0),
  clerkRevocationNextAttemptAt: timestamp("clerk_revocation_next_attempt_at", { withTimezone: true }),
  clerkRevocationLastAttemptAt: timestamp("clerk_revocation_last_attempt_at", { withTimezone: true }),
  clerkRevocationLastError: varchar("clerk_revocation_last_error", { length: 240 }),
  status: invitationStatus("status").notNull().default("pending"),
  invitedByClerkUserId: varchar("invited_by_clerk_user_id", { length: 128 }).notNull(),
  acceptedByClerkUserId: varchar("accepted_by_clerk_user_id", { length: 128 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("company_invitations_token_uq").on(t.tokenHash),
  index("company_invitations_company_idx").on(t.companyId),
  index("company_invitations_email_idx").on(t.email),
  index("company_invitations_revocation_retry_idx").on(t.clerkRevocationPending, t.clerkRevocationNextAttemptAt),
]);
export const worksTable = pgTable("works", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), client: text("client").notNull(), location: text("location").notNull(), status: workStatus("status").notNull(),
  progress: integer("progress").notNull(), budget: integer("budget").notNull(), startDate: date("start_date", { mode: "string" }).notNull(), endDate: date("end_date", { mode: "string" }).notNull(), manager: text("manager").notNull(),
}, t => [index("works_company_idx").on(t.companyId)]);
export const budgetItemsTable = pgTable("budget_items", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), code: text("code").notNull(), name: text("name").notNull(),
  budgeted: integer("budgeted").notNull(), spent: integer("spent").notNull().default(0), committed: integer("committed").notNull().default(0), unit: varchar("unit", { length: 30 }).notNull(),
}, t => [index("budget_items_company_work_idx").on(t.companyId, t.workId)]);
export const expensesTable = pgTable("expenses", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), itemId: varchar("item_id", { length: 80 }).notNull().references(() => budgetItemsTable.id),
  description: text("description").notNull(), amount: integer("amount").notNull(), type: expenseType("type").notNull(), date: date("date", { mode: "string" }).notNull(), vendor: text("vendor").notNull(),
}, t => [index("expenses_company_work_idx").on(t.companyId, t.workId)]);
export const commitmentsTable = pgTable("commitments", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), itemId: varchar("item_id", { length: 80 }).references(() => budgetItemsTable.id), description: text("description").notNull(), amount: integer("amount").notNull(),
}, t => [index("commitments_company_work_idx").on(t.companyId, t.workId)]);
export const incidentsTable = pgTable("incidents", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), title: text("title").notNull(), description: text("description").notNull(), status: incidentStatus("status").notNull(), priority: incidentPriority("priority").notNull(), assignee: text("assignee").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("incidents_company_work_idx").on(t.companyId, t.workId)]);
export const subcontractorsTable = pgTable("subcontractors", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), specialty: text("specialty").notNull(), phone: text("phone").notNull(), email: text("email").notNull(), status: subcontractorStatus("status").notNull(),
}, t => [index("subcontractors_company_idx").on(t.companyId)]);
export const contractsTable = pgTable("contracts", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), subcontractorId: varchar("subcontractor_id", { length: 80 }).notNull().references(() => subcontractorsTable.id),
  scope: text("scope").notNull(), amount: integer("amount").notNull(), progress: integer("progress").notNull(), approvedPaid: integer("approved_paid").notNull().default(0), pendingPayment: integer("pending_payment").notNull().default(0), evidenceCount: integer("evidence_count").notNull().default(0),
}, t => [index("contracts_company_work_idx").on(t.companyId, t.workId)]);

export const attachmentsTable = pgTable("attachments", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id", { length: 80 }).references(() => incidentsTable.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id", { length: 80 }).references(() => contractsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("attachments_company_idx").on(t.companyId),
  index("attachments_incident_idx").on(t.incidentId),
  index("attachments_contract_idx").on(t.contractId),
]);

export const pendingUploadsTable = pgTable("pending_uploads", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  objectPath: text("object_path").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  size: integer("size").notNull(),
  uploaded: boolean("uploaded").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("pending_uploads_company_user_idx").on(t.companyId, t.userId),
  index("pending_uploads_expires_idx").on(t.expiresAt),
]);
export const companySettingsTable = pgTable("company_settings", {
  companyId: varchar("company_id", { length: 80 }).primaryKey().references(() => companiesTable.id, { onDelete: "cascade" }),
  profitability: boolean("profitability").notNull().default(true), communications: boolean("communications").notNull().default(true), subcontractors: boolean("subcontractors").notNull().default(true),
});
export const companyMetricsTable = pgTable("company_metrics", {
  companyId: varchar("company_id", { length: 80 }).primaryKey().references(() => companiesTable.id, { onDelete: "cascade" }),
  worksCreated: integer("works_created").notNull().default(0), worksReviewed: integer("works_reviewed").notNull().default(0), expensesRegistered: integer("expenses_registered").notNull().default(0), costAlertsActedOn: integer("cost_alerts_acted_on").notNull().default(0), incidencesCreated: integer("incidences_created").notNull().default(0), incidencesResolved: integer("incidences_resolved").notNull().default(0), evidenceUploads: integer("evidence_uploads").notNull().default(0), paymentApprovals: integer("payment_approvals").notNull().default(0), moduleChanges: integer("module_changes").notNull().default(0),
});
export const addressedCostAlertsTable = pgTable("addressed_cost_alerts", {
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }), budgetItemId: varchar("budget_item_id", { length: 80 }).notNull(), addressedAt: timestamp("addressed_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.companyId, t.budgetItemId] }), index("addressed_alerts_company_idx").on(t.companyId)]);
export const auditEventsTable = pgTable("audit_events", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  actorUserId: varchar("actor_user_id", { length: 128 }).notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  targetId: varchar("target_id", { length: 128 }),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("audit_events_company_created_idx").on(t.companyId, t.createdAt)]);
