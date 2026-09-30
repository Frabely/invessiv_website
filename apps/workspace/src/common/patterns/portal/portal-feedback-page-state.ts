import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import {
  PortalFeedbackPageState,
  type PortalFeedbackPageState as PortalFeedbackPageStateValue,
} from "@/common/constants/portal/portal-feedback-page-states";

/** The running round decides first; without one, approval beats an exhausted quota. */
export function portalFeedbackPageState(
  feedback: Pick<
    PortalProjectFeedbackDto,
    "activeRound" | "quota" | "canSubmit"
  >,
): PortalFeedbackPageStateValue {
  const { activeRound, quota } = feedback;
  if (activeRound?.status === FeedbackRoundStatus.Open)
    return feedback.canSubmit
      ? PortalFeedbackPageState.Sheet
      : PortalFeedbackPageState.OpenReadOnly;
  if (activeRound?.status === FeedbackRoundStatus.Submitted)
    return PortalFeedbackPageState.Submitted;
  if (activeRound?.status === FeedbackRoundStatus.InDiscussion)
    return PortalFeedbackPageState.Discussion;
  if (activeRound) return PortalFeedbackPageState.Working;
  if (quota.approvedRoundNumber !== null)
    return PortalFeedbackPageState.Approved;
  if (quota.used === 0) return PortalFeedbackPageState.None;
  if (quota.remaining === 0) return PortalFeedbackPageState.Exhausted;
  return PortalFeedbackPageState.Between;
}
