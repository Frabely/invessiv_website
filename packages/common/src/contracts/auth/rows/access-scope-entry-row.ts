import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";

/** One scoped grant joined with the names a list shows; `project_title` is null for a customer grant. */
export type AccessScopeEntryRow = {
  id: string;
  workspace_member_id: string;
  member_display_name: string;
  role_id: string;
  role_name: string;
  role_system_key: SystemRoleKey | null;
  role_active: boolean;
  customer_id: string;
  customer_number: number;
  customer_display_name: string;
  project_id: string | null;
  project_title: string | null;
  assigned_by_user_id: string;
  assigned_at: Date;
};
