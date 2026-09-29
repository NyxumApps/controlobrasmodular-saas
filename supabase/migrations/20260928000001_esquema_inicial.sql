-- Esquema inicial de ObraControl.
-- Copia literal del DDL de SPEC_MIGRACION_COMPLETA.md (sección 2), generado por Drizzle Kit.
-- Las columnas *clerk_user_id conservan su nombre original y guardan el id del usuario de Supabase Auth.

CREATE TYPE "public"."expense_type" AS ENUM('material', 'mano_obra', 'equipo', 'subcontrato', 'otro');
CREATE TYPE "public"."incident_priority" AS ENUM('alta', 'media', 'baja');
CREATE TYPE "public"."incident_status" AS ENUM('abierto', 'en proceso', 'resuelto');
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked');
CREATE TYPE "public"."membership_role" AS ENUM('owner_manager', 'office', 'site_manager');
CREATE TYPE "public"."subcontractor_status" AS ENUM('activo', 'inactivo');
CREATE TYPE "public"."work_status" AS ENUM('planificación', 'en curso', 'pausada', 'completada');
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" varchar(50) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"module" varchar(30) NOT NULL,
	"properties" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "addressed_cost_alerts" (
	"company_id" varchar(80) NOT NULL,
	"budget_item_id" varchar(80) NOT NULL,
	"addressed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addressed_cost_alerts_company_id_budget_item_id_pk" PRIMARY KEY("company_id","budget_item_id")
);

CREATE TABLE "attachments" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"incident_id" varchar(80),
	"contract_id" varchar(80),
	"object_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" varchar(160) NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_object_path_unique" UNIQUE("object_path")
);

CREATE TABLE "audit_events" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"actor_user_id" varchar(128) NOT NULL,
	"action" varchar(80) NOT NULL,
	"target_id" varchar(128),
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "budget_items" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"budgeted" integer NOT NULL,
	"spent" integer DEFAULT 0 NOT NULL,
	"committed" integer DEFAULT 0 NOT NULL,
	"unit" varchar(30) NOT NULL
);

CREATE TABLE "commitments" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"item_id" varchar(80),
	"description" text NOT NULL,
	"amount" integer NOT NULL
);

CREATE TABLE "companies" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "company_invitations" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "membership_role" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"clerk_invitation_id" varchar(128),
	"clerk_revocation_pending" boolean DEFAULT false NOT NULL,
	"clerk_revocation_attempts" integer DEFAULT 0 NOT NULL,
	"clerk_revocation_next_attempt_at" timestamp with time zone,
	"clerk_revocation_last_attempt_at" timestamp with time zone,
	"clerk_revocation_last_error" varchar(240),
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by_clerk_user_id" varchar(128) NOT NULL,
	"accepted_by_clerk_user_id" varchar(128),
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "company_metrics" (
	"company_id" varchar(80) PRIMARY KEY NOT NULL,
	"works_created" integer DEFAULT 0 NOT NULL,
	"works_reviewed" integer DEFAULT 0 NOT NULL,
	"expenses_registered" integer DEFAULT 0 NOT NULL,
	"cost_alerts_acted_on" integer DEFAULT 0 NOT NULL,
	"incidences_created" integer DEFAULT 0 NOT NULL,
	"incidences_resolved" integer DEFAULT 0 NOT NULL,
	"evidence_uploads" integer DEFAULT 0 NOT NULL,
	"payment_approvals" integer DEFAULT 0 NOT NULL,
	"module_changes" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "company_settings" (
	"company_id" varchar(80) PRIMARY KEY NOT NULL,
	"profitability" boolean DEFAULT true NOT NULL,
	"communications" boolean DEFAULT true NOT NULL,
	"subcontractors" boolean DEFAULT true NOT NULL
);

CREATE TABLE "contracts" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"subcontractor_id" varchar(80) NOT NULL,
	"scope" text NOT NULL,
	"amount" integer NOT NULL,
	"progress" integer NOT NULL,
	"approved_paid" integer DEFAULT 0 NOT NULL,
	"pending_payment" integer DEFAULT 0 NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "expenses" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"item_id" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "expense_type" NOT NULL,
	"date" date NOT NULL,
	"vendor" text NOT NULL
);

CREATE TABLE "incidents" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "incident_status" NOT NULL,
	"priority" "incident_priority" NOT NULL,
	"assignee" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "memberships" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"clerk_user_id" varchar(128) NOT NULL,
	"role" "membership_role" DEFAULT 'site_manager' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pending_uploads" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"object_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" varchar(160) NOT NULL,
	"size" integer NOT NULL,
	"uploaded" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_uploads_object_path_unique" UNIQUE("object_path")
);

CREATE TABLE "subcontractors" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" "subcontractor_status" NOT NULL
);

CREATE TABLE "works" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"client" text NOT NULL,
	"location" text NOT NULL,
	"status" "work_status" NOT NULL,
	"progress" integer NOT NULL,
	"budget" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"manager" text NOT NULL
);

ALTER TABLE "addressed_cost_alerts" ADD CONSTRAINT "addressed_cost_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_item_id_budget_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."budget_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_metrics" ADD CONSTRAINT "company_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_subcontractor_id_subcontractors_id_fk" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_item_id_budget_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."budget_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "works" ADD CONSTRAINT "works_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");
CREATE INDEX "analytics_events_visitor_idx" ON "analytics_events" USING btree ("visitor_hash");
CREATE INDEX "addressed_alerts_company_idx" ON "addressed_cost_alerts" USING btree ("company_id");
CREATE INDEX "attachments_company_idx" ON "attachments" USING btree ("company_id");
CREATE INDEX "attachments_incident_idx" ON "attachments" USING btree ("incident_id");
CREATE INDEX "attachments_contract_idx" ON "attachments" USING btree ("contract_id");
CREATE INDEX "audit_events_company_created_idx" ON "audit_events" USING btree ("company_id","created_at");
CREATE INDEX "budget_items_company_work_idx" ON "budget_items" USING btree ("company_id","work_id");
CREATE INDEX "commitments_company_work_idx" ON "commitments" USING btree ("company_id","work_id");
CREATE UNIQUE INDEX "company_invitations_token_uq" ON "company_invitations" USING btree ("token_hash");
CREATE INDEX "company_invitations_company_idx" ON "company_invitations" USING btree ("company_id");
CREATE INDEX "company_invitations_email_idx" ON "company_invitations" USING btree ("email");
CREATE INDEX "company_invitations_revocation_retry_idx" ON "company_invitations" USING btree ("clerk_revocation_pending","clerk_revocation_next_attempt_at");
CREATE INDEX "contracts_company_work_idx" ON "contracts" USING btree ("company_id","work_id");
CREATE INDEX "expenses_company_work_idx" ON "expenses" USING btree ("company_id","work_id");
CREATE INDEX "incidents_company_work_idx" ON "incidents" USING btree ("company_id","work_id");
CREATE UNIQUE INDEX "memberships_clerk_user_uq" ON "memberships" USING btree ("clerk_user_id");
CREATE INDEX "memberships_company_idx" ON "memberships" USING btree ("company_id");
CREATE INDEX "pending_uploads_company_user_idx" ON "pending_uploads" USING btree ("company_id","user_id");
CREATE INDEX "pending_uploads_expires_idx" ON "pending_uploads" USING btree ("expires_at");
CREATE INDEX "subcontractors_company_idx" ON "subcontractors" USING btree ("company_id");
CREATE INDEX "works_company_idx" ON "works" USING btree ("company_id");
