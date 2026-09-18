import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";
import type { Permission } from "@invessiv/common/constants/auth/permissions";

export type ProjectPermissionScope = {
  customerId: string;
  permissions: ReadonlySet<Permission>;
};

export interface WorkspaceActor extends PermissionHolder {
  /** Persisted `users.id`; activities and security events reference this, never the Clerk id. */
  userId: string;
  /** Active `workspace_members.id`; the anchor for ownership and responsibilities. */
  workspaceMemberId: string;
  /** Permissions inherited from a scoped customer-role assignment. */
  customerPermissions: ReadonlyMap<string, ReadonlySet<Permission>>;
  /** Permissions granted for one project only, including its customer for validation. */
  projectPermissions: ReadonlyMap<string, ProjectPermissionScope>;
}
