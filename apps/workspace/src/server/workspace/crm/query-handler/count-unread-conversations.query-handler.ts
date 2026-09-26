import "server-only";

import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversationService } from "@/server/workspace/crm/services/conversation-service";

export async function countUnreadConversations(
  actor: WorkspaceActor,
): Promise<number> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const items = await conversationService.listVisibleInbox(tx, actor);
    return items.filter((item) => item.unreadCount > 0).length;
  });
}
