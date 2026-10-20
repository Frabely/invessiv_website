import "server-only";
import { feedbackClarificationMappingService } from "@/server/shared/services/feedback/feedback-clarification-mapping-service";
import type { FeedbackClarificationRow } from "@/server/shared/services/feedback/feedback-service-types";

import { RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type {
  FeedbackRoundRow,
  LoadedFeedbackItem,
} from "@/server/shared/services/feedback/feedback-service-types";

function toItemDto(
  { item, attachments }: LoadedFeedbackItem,
  resultsVisible: boolean,
  clarifications: readonly FeedbackClarificationRow[] = [],
): PortalFeedbackItemDto {
  return {
    id: item.id,
    version: item.version,
    clarifications: clarifications.map(
      feedbackClarificationMappingService.toPublicDto,
    ),
    position: item.position,
    areaLabel: item.area_label,
    kind: item.kind,
    body: item.body,
    result: resultsVisible ? item.result : null,
    resultNote: resultsVisible ? item.result_note : null,
    attachments,
  };
}

/** Results the team already set stay hidden until the round is completed or approved. */
function toRoundDto(
  row: FeedbackRoundRow,
  items: readonly LoadedFeedbackItem[],
  contactNames: ReadonlyMap<string, string>,
  clarifications: ReadonlyMap<string, FeedbackClarificationRow[]> = new Map(),
): PortalFeedbackRoundDto {
  const resultsVisible = (
    RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]
  ).includes(row.status);
  return {
    id: row.id,
    roundNumber: row.round_number,
    status: row.status,
    previewUrl: row.preview_url,
    handoverNote: row.handover_note,
    dueOn: row.due_on,
    areaOptions: row.area_options,
    draftUpdatedAt: row.draft_updated_at?.toISOString() ?? null,
    draftUpdatedByName: row.draft_updated_by_portal_membership_id
      ? (contactNames.get(row.draft_updated_by_portal_membership_id) ?? null)
      : null,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    customerNotice: row.customer_notice,
    completedAt: row.completed_at?.toISOString() ?? null,
    approvedAt: row.approved_at?.toISOString() ?? null,
    items: items.map((item) =>
      toItemDto(item, resultsVisible, clarifications.get(item.item.id) ?? []),
    ),
    version: row.version,
  };
}

export const portalFeedbackMappingService = {
  toItemDto,
  toRoundDto,
} as const;
