import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";

/** One persisted role grant limited to a customer or project. */
export interface WorkspaceMemberAccessScopeDto {
  /** Stable scoped-role assignment id. */
  id: string;
  /**
   * `workspace_members.id` of the holder, not `users.id`. Lets a list per customer say who holds
   * each grant without a second lookup.
   */
  workspaceMemberId: string;
  /** Assigned role id. */
  roleId: string;
  /** Customer or project boundary. */
  scope: AccessScopeDto;
  /** Persisted users.id of the granting actor. */
  assignedByUserId: string;
  /** ISO timestamp of the grant. */
  assignedAt: string;
}
