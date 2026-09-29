import "server-only";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { FeedbackRoundSummaryDto } from "@invessiv/common/contracts/crm/feedback-round-summary.dto";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type {
  FeedbackRoundRow,
  LoadedFeedbackItem,
} from "@/server/shared/services/feedback/feedback-service-types";

function toItemDto({
  item,
  attachments,
}: LoadedFeedbackItem): FeedbackRoundItemDto {
  return {
    id: item.id,
    position: item.position,
    areaLabel: item.area_label,
    kind: item.kind,
    body: item.body,
    createdByPortalMembershipId: item.created_by_portal_membership_id,
    result: item.result,
    resultNote: item.result_note,
    resultSetByMemberId: item.result_set_by_member_id,
    resultSetAt: item.result_set_at?.toISOString() ?? null,
    attachments,
    version: item.version,
  };
}

/** Unread is the inbox notion: submitted and not yet opened by any member. */
function toSummaryDto(
  row: FeedbackRoundRow,
  itemCount: number,
): FeedbackRoundSummaryDto {
  return {
    id: row.id,
    roundNumber: row.round_number,
    status: row.status,
    handedOverAt: row.handed_over_at.toISOString(),
    dueOn: row.due_on,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null,
    approvedAt: row.approved_at?.toISOString() ?? null,
    itemCount,
    unread:
      row.status === FeedbackRoundStatus.Submitted && row.read_at === null,
  };
}

function toDto(
  row: FeedbackRoundRow,
  items: readonly LoadedFeedbackItem[],
): FeedbackRoundDto {
  return {
    id: row.id,
    projectId: row.project_id,
    customerId: row.customer_id,
    roundNumber: row.round_number,
    status: row.status,
    previewUrl: row.preview_url,
    handoverNote: row.handover_note,
    dueOn: row.due_on,
    areaOptions: row.area_options,
    handedOverByMemberId: row.handed_over_by_member_id,
    handedOverAt: row.handed_over_at.toISOString(),
    draftUpdatedAt: row.draft_updated_at?.toISOString() ?? null,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    submittedByPortalMembershipId: row.submitted_by_portal_membership_id,
    customerNotice: row.customer_notice,
    startedAt: row.started_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null,
    completedByMemberId: row.completed_by_member_id,
    approvedAt: row.approved_at?.toISOString() ?? null,
    approvedByPortalMembershipId: row.approved_by_portal_membership_id,
    readAt: row.read_at?.toISOString() ?? null,
    items: items.map(toItemDto),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const feedbackRoundMappingService = {
  toDto,
  toSummaryDto,
} as const;
