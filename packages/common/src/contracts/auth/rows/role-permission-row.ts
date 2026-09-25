import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";

/** One row per granted permission; `permission_key` is null for a role without permissions. */
export type RolePermissionRow = {
  realm: AuthRealm;
  id: string;
  name: string;
  system_key: SystemRoleKey | null;
  description: string | null;
  is_system: boolean;
  active: boolean;
  scope_assignable?: boolean | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  permission_key: string | null;
};
