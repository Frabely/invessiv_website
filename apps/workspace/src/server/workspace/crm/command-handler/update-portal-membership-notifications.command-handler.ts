import "server-only";

import type { UpdatePortalMembershipRequestDto } from "@invessiv/common/contracts/crm/update-portal-membership-request.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { membershipUpdateService } from "@/server/workspace/crm/services/portal-access/membership-update-service";

export function updatePortalMembershipNotifications(
  membershipId: string,
  input: UpdatePortalMembershipRequestDto,
  actor: WorkspaceActor,
) {
  return membershipUpdateService.updateNotifications(
    membershipId,
    input,
    actor,
  );
}
