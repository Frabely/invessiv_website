import type { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";

/** One project entry of the dashboard feedback widget. */
export interface PortalFeedbackSummaryDto {
  /** Project the entry links to. */
  projectId: string;
  /** Project title shown in the widget. */
  projectTitle: string;
  /** Latest round of the project; decides whose turn it is. */
  roundNumber: number;
  /** Status of that round. */
  status: FeedbackRoundStatus;
  /** Requested feedback date of that round; null when none was set. */
  dueOn: string | null;
  /** Round steps in the project's track. */
  included: number;
  /** Rounds handed over so far. */
  used: number;
}
