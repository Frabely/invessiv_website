import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";

/** Body of a scoped role grant to an existing workspace member. */
export interface GrantAccessScopeRequestDto extends VersionedWriteInput {
  /** Active custom role that is explicitly scope-assignable. */
  roleId: string;
  /** Customer or project for which that role is effective. */
  scope: AccessScopeDto;
}
