import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";

/** One row per granted permission; `permission_key` is null for a role without permissions. */
export type RolePermissionRow = {
  id: string;
  name: string;
  system_key: SystemRoleKey | null;
  description: string | null;
  is_system: boolean;
  active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
  permission_key: string | null;
};
