import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { feedbackInboxService } from "@/server/workspace/crm/services/feedback/feedback-inbox-service";

export async function countUnreadFeedbackRounds(
  actor: WorkspaceActor,
): Promise<number> {
  return feedbackInboxService.countUnread(getDrizzleDatabaseClient(), actor);
}
