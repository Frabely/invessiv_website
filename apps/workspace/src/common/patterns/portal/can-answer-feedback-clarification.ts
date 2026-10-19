import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import {
  type FeedbackRoundStatus,
  RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES,
} from "@invessiv/common/constants/crm/feedback-round-statuses";

/**
 * Whether the portal offers the answer form on a question. `canSubmit` already carries the read and
 * submit rights and excludes the owner view; the command checks everything again.
 */
export function canAnswerFeedbackClarification(
  canSubmit: boolean,
  roundStatus: FeedbackRoundStatus,
  clarificationStatus: FeedbackClarificationStatus,
): boolean {
  return (
    canSubmit &&
    clarificationStatus === FeedbackClarificationStatus.Open &&
    (
      RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]
    ).includes(roundStatus)
  );
}
