import type { CompanyRole } from "../middlewares/auth";

export type Permission =
  | "company_settings" | "member_roles" | "create_work" | "expense"
  | "incident" | "incident_status" | "approve_payment" | "evidence"
  | "cost_alert" | "work_review" | "modules";

const policy: Record<CompanyRole, readonly Permission[]> = {
  owner_manager: ["company_settings", "member_roles", "create_work", "expense", "incident", "incident_status", "approve_payment", "evidence", "cost_alert", "work_review", "modules"],
  office: ["company_settings", "create_work", "expense", "incident", "incident_status", "approve_payment", "evidence", "cost_alert", "work_review", "modules"],
  site_manager: ["expense", "incident", "incident_status", "evidence", "work_review"],
};
export const can = (role: CompanyRole, permission: Permission): boolean => policy[role].includes(permission);