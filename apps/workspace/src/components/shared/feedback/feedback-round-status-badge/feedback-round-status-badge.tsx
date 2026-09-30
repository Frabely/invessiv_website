import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { Badge } from "@invessiv/ui";
import { FEEDBACK_ROUND_STATUS_BADGES } from "@/common/constants/feedback/feedback-round-status-badges";

export type FeedbackRoundStatusBadgeProps = {
  status: FeedbackRoundStatus;
  /** Worded by the caller: the CRM names the state, the portal says whose turn it is. */
  label: string;
};

export function FeedbackRoundStatusBadge({
  status,
  label,
}: FeedbackRoundStatusBadgeProps) {
  const badge = FEEDBACK_ROUND_STATUS_BADGES[status];
  return (
    <Badge icon={badge.icon} kind="status" label={label} tone={badge.tone} />
  );
}
