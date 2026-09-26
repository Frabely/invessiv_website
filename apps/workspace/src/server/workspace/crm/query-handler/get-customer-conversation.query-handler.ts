import "server-only";

import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { conversationService } from "@/server/workspace/crm/services/conversation-service";

export async function getCustomerConversation(
  customerId: string,
  actor: WorkspaceActor,
  cursor: string | null,
): Promise<InternalConversationDto | null> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const conversation =
      await conversationService.getOrCreateReadableConversation(
        tx,
        customerId,
        actor,
      );
    return conversation
      ? conversationService.getConversationDetail(
          tx,
          conversation,
          actor,
          cursor,
        )
      : null;
  });
}
