import type { Permission } from "@invessiv/common/constants/auth/permissions";

export interface PermissionHolder {
  /**
   * Effective permissions resolved from the database for the current request. The holder never
   * knows which role granted a permission — only whether it has it.
   */
  permissions: ReadonlySet<Permission>;
}
