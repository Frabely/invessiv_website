import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";

export interface WorkspaceActor extends PermissionHolder {
  /** Persisted `users.id`; activities and security events reference this, never the Clerk id. */
  userId: string;
  /** Active `workspace_members.id`; the anchor for ownership and responsibilities. */
  workspaceMemberId: string;
}
