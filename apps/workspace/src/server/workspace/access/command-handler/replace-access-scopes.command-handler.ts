import "server-only";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { ReplaceAccessScopesRequestDto } from "@invessiv/common/contracts/auth/replace-access-scopes-request.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { memberRoleAssignmentService } from "@/server/workspace/access/services/member-role-assignment-service";

/** Replaces only scoped roles while preserving the member's workspace-wide roles. */
export async function replaceAccessScopes(
  memberId: string,
  input: ReplaceAccessScopesRequestDto,
  actor: WorkspaceActor,
) {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.MemberNotFound,
    };
  }
  const validation = accessSchemas.replaceAccessScopes.safeParse(input);
  if (!validation.success) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }
  return memberRoleAssignmentService.replace(
    memberId,
    {
      accessScopeAssignments: validation.data.assignments,
      version: validation.data.version,
    },
    actor,
  );
}
