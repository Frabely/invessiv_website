import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/** Complete desired set of customer and project roles for one workspace member. */
export interface ReplaceAccessScopesRequestDto extends VersionedWriteInput {
  /** Full replacement set; assignments omitted here are revoked atomically. */
  assignments: AccessScopeAssignmentDto[];
}
