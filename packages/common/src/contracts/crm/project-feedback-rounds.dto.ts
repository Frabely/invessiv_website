import type { FeedbackHandOverBlocker } from "../../constants/crm/feedback-hand-over-blockers";
import type { FeedbackQuotaDto } from "./feedback-quota.dto";
import type { FeedbackRoundSummaryDto } from "./feedback-round-summary.dto";

/** Feedback section of one project in the CRM: quota, round list and whether a handover is possible. */
export interface ProjectFeedbackRoundsDto {
  /** Project the rounds belong to. */
  projectId: string;
  /** Included, used and remaining rounds, plus the running and the approved round. */
  quota: FeedbackQuotaDto;
  /** All rounds of the project, newest first. */
  rounds: FeedbackRoundSummaryDto[];
  /** Area list saved on the project; the handover dialog starts from it. */
  feedbackAreas: string[];
  /** Round number the next handover would create; null once the quota is used up or the project is approved. */
  nextRoundNumber: number | null;
  /** True only when nothing blocks the handover and the viewer may write the project. */
  canHandOver: boolean;
  /** Why the next round cannot be handed over; null when the project itself allows it, even if the viewer may not. */
  handOverBlocker: FeedbackHandOverBlocker | null;
}
