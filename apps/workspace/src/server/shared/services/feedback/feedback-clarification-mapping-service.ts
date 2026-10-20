import "server-only";

import type { FeedbackItemClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-clarification.dto";
import type { FeedbackItemInternalClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-internal-clarification.dto";
import type { FeedbackClarificationRow } from "./feedback-service-types";

function toPublicDto(
  row: FeedbackClarificationRow,
): FeedbackItemClarificationDto {
  return {
    id: row.id,
    status: row.status,
    question: row.question,
    requestedAt: row.requested_at.toISOString(),
    answer: row.answer,
    answeredAt: row.answered_at?.toISOString() ?? null,
    closeNote: row.close_note,
    closedAt: row.closed_at?.toISOString() ?? null,
  };
}

function toInternalDto(
  row: FeedbackClarificationRow,
  memberNames: ReadonlyMap<string, string | null>,
  contactNames: ReadonlyMap<string, string>,
): FeedbackItemInternalClarificationDto {
  return {
    ...toPublicDto(row),
    requestedByName: memberNames.get(row.requested_by_member_id) ?? null,
    answeredByName: row.answered_by_portal_membership_id
      ? (contactNames.get(row.answered_by_portal_membership_id) ?? null)
      : null,
    closedByName: row.closed_by_member_id
      ? (memberNames.get(row.closed_by_member_id) ?? null)
      : null,
  };
}

export const feedbackClarificationMappingService = {
  toPublicDto,
  toInternalDto,
} as const;
