import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/** Body of `PUT /api/workspace/members/[id]/roles`. `version` is the member's version. */
export interface ReplaceWorkspaceMemberRolesRequestDto extends VersionedWriteInput {
  /**
   * The complete set of non-owner roles afterwards. An existing owner assignment is kept
   * untouched; sending the owner role id is an error, not a no-op.
   */
  roleIds: string[];
}
