import "server-only";

import type { ReplacePortalMembershipRolesRequestDto } from "@invessiv/common/contracts/crm/replace-portal-membership-roles-request.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { membershipUpdateService } from "@/server/workspace/crm/services/portal-access/membership-update-service";

export function replacePortalMembershipRoles(
  membershipId: string,
  input: ReplacePortalMembershipRolesRequestDto,
  actor: WorkspaceActor,
) {
  return membershipUpdateService.replaceRoles(membershipId, input, actor);
}
