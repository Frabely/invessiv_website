import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";

/** One row per role assignment; role columns are null for a member without any assignment. */
export type WorkspaceMemberRoleRow = {
  member_id: string;
  user_id: string;
  display_name: string;
  primary_email: string;
  member_active: boolean;
  member_version: number;
  member_created_at: Date;
  role_id: string | null;
  role_name: string | null;
  role_system_key: SystemRoleKey | null;
  role_active: boolean | null;
};
