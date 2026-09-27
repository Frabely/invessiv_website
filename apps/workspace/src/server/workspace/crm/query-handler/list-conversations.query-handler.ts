import "server-only";

import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

export async function listConversations(
  actor: WorkspaceActor,
): Promise<ConversationInboxItemDto[]> {
  return getDrizzleDatabaseClient().transaction((tx) =>
    internalConversationService.listVisibleInbox(tx, actor),
  );
}
