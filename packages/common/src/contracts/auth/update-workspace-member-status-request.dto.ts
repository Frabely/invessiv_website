import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/** Body of `PATCH /api/workspace/members/[id]`. */
export interface UpdateWorkspaceMemberStatusRequestDto extends VersionedWriteInput {
  /** Desired membership state; an unchanged state is rejected without writing an event. */
  active: boolean;
}
