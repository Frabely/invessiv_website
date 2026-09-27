import "server-only";

import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

/** Only someone who may reassign the conversation learns who else could own it. */
export async function listConversationOwnerCandidates(
  customerId: string,
  actor: WorkspaceActor,
): Promise<WorkspaceMemberOptionDto[]> {
  if (!internalConversationService.actorMayAssignOwner(actor, customerId))
    return [];
  return getDrizzleDatabaseClient().transaction((tx) =>
    internalConversationService.listOwnerCandidates(tx, customerId),
  );
}
