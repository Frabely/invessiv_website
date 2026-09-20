import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { VersionedDto } from "@invessiv/common/contracts/concurrency/versioned";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";

/** A workspace role with its permission set, as edited in the roles tab. */
export interface RoleDto extends RoleSummaryDto, VersionedDto {
  /** False identifies a global role; true identifies a customer/project role. */
  scopeAssignable: boolean;
  /** Optional free text for custom roles. System roles carry no editable description. */
  description: string | null;
  /** System roles are immutable; only their assignment to members can change. */
  isSystem: boolean;
  /**
   * Exact permission keys of the role in catalog order. Unknown keys from the database are
   * dropped by the mapper instead of being passed on.
   */
  permissions: Permission[];
  /** Number of memberships holding the role, active or not. Informs before a deactivation. */
  assignedMemberCount: number;
  /** ISO string of the role creation time. */
  createdAt: string;
  /** ISO string. Bumped by `updateVersioned` together with `version`. */
  updatedAt: string;
}
