import "server-only";

import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import type { FeedbackItemResultHistoryEntryDto } from "@invessiv/common/contracts/crm/feedback-item-result-history-entry.dto";
import type { FeedbackResultHistoryRow } from "./feedback-service-types";

/** Author ids and command ids stay on the server; the entry only names who acted. */
function toEntryDto(
  row: FeedbackResultHistoryRow,
  memberName: string | null,
  contactNames: ReadonlyMap<string, string>,
): FeedbackItemResultHistoryEntryDto {
  return {
    id: row.id,
    kind: row.event_kind,
    itemVersion: row.item_version,
    result: row.result,
    resultNote: row.result_note,
    actorSide: row.actor_side,
    actorName:
      row.actor_side === FeedbackResultActorSide.Member
        ? memberName
        : row.actor_portal_membership_id
          ? (contactNames.get(row.actor_portal_membership_id) ?? null)
          : null,
    occurredAt: row.occurred_at.toISOString(),
  };
}

export const feedbackResultHistoryMappingService = {
  toEntryDto,
} as const;
