import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/** Complete desired global and scoped role state for one workspace member. */
export interface ReplaceMemberRoleAssignmentsRequestDto extends VersionedWriteInput {
  /** Complete set of non-owner workspace-wide role ids. */
  roleIds: string[];
  /** Complete set of customer and project role assignments. */
  accessScopeAssignments: AccessScopeAssignmentDto[];
}
