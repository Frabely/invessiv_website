import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";

/** Desired role binding used when replacing all scoped access of a member. */
export interface AccessScopeAssignmentDto {
  /** Active custom role that is explicitly scope-assignable. */
  roleId: string;
  /** Customer or project boundary for the role. */
  scope: AccessScopeDto;
}
