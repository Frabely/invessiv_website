import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/**
 * Body of `POST` and `DELETE /api/workspace/members/[id]/owner`. Only the member's version:
 * the direction follows from the HTTP method.
 */
export type ChangeWorkspaceOwnerRequestDto = VersionedWriteInput;
