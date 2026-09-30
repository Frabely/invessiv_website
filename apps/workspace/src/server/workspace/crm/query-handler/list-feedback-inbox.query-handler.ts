import "server-only";

import type { FeedbackInboxDto } from "@invessiv/common/contracts/crm/feedback-inbox.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { feedbackInboxService } from "@/server/workspace/crm/services/feedback/feedback-inbox-service";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";

/** Every round the team is on turn for, across all customers and projects the member may read. */
export async function listFeedbackInbox(
  filters: FeedbackInboxFilters,
  actor: WorkspaceActor,
): Promise<FeedbackInboxDto> {
  const db = getDrizzleDatabaseClient();
  const [rows, customers] = await Promise.all([
    feedbackInboxService.list(db, filters, actor),
    feedbackInboxService.listCustomers(db, actor),
  ]);
  return {
    items: rows.map(feedbackRoundMappingService.toInboxItemDto),
    customers,
  };
}
