import type { VersionedDto } from "@invessiv/common/contracts/concurrency/versioned";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";

/** An internal member as listed in the settings area. */
export interface WorkspaceMemberDto extends VersionedDto {
  /** `workspace_members.id`. Every member mutation addresses this id, never the user id. */
  id: string;
  /** `users.id` behind the membership; activities and security events reference this value. */
  userId: string;
  /** Copied from Clerk and refreshed when the list is rendered. Master data only. */
  displayName: string;
  /** Copied from Clerk for display. Never used to find, bind or authorize a member. */
  primaryEmail: string;
  /** Inactive members are denied on their next request. Deactivation arrives in unit 03c. */
  active: boolean;
  /**
   * Derived from an assignment of the `workspace_owner` system role. Kept apart from `roles`
   * because the owner role only changes through the dedicated owner flow.
   */
  isOwner: boolean;
  /**
   * True while at least one assigned role, the owner role included, is active. A member whose
   * roles are all inactive may still sign in but sees no area; the list flags that state
   * instead of forbidding it. Display only, never authorizes.
   */
  hasActiveRole: boolean;
  /**
   * Number of role grants bound to a customer or project, counting grants whose role is inactive
   * because the access dialog lists them too. Display only, never authorizes.
   */
  accessScopeCount: number;
  /**
   * Assigned roles without the owner role, ordered system roles first, then by name. Inactive
   * roles are included and flagged, because they are still assigned.
   */
  roles: RoleSummaryDto[];
  /** ISO string of the membership creation time. */
  createdAt: string;
}
