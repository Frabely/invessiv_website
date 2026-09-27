import "server-only";

import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

export async function countUnreadConversations(
  actor: WorkspaceActor,
): Promise<number> {
  return getDrizzleDatabaseClient().transaction((tx) =>
    internalConversationService.countUnreadConversations(tx, actor),
  );
}
