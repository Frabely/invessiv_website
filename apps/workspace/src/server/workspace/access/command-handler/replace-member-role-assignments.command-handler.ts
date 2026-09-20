import "server-only";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { ReplaceMemberRoleAssignmentsRequestDto } from "@invessiv/common/contracts/auth/replace-member-role-assignments-request.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { memberRoleAssignmentService } from "@/server/workspace/access/services/member-role-assignment-service";

/** Replaces the complete global and scoped role draft in one transaction. */
export async function replaceMemberRoleAssignments(
  memberId: string,
  input: ReplaceMemberRoleAssignmentsRequestDto,
  actor: WorkspaceActor,
) {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.MemberNotFound,
    };
  }
  const validation =
    accessSchemas.replaceMemberRoleAssignments.safeParse(input);
  if (!validation.success) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }
  return memberRoleAssignmentService.replace(memberId, validation.data, actor);
}
