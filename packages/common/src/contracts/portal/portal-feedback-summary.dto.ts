import type { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";

/** The dashboard feedback widget's view of the selected project's rounds. */
export interface PortalFeedbackSummaryDto {
  /** Project the entry links to. */
  projectId: string;
  /** Project title shown in the widget. */
  projectTitle: string;
  /** Latest round of the project; decides whose turn it is. Null while none was handed over. */
  roundNumber: number | null;
  /** Status of that round; null while none was handed over. */
  status: FeedbackRoundStatus | null;
  /** Requested feedback date of that round; null when none was set. */
  dueOn: string | null;
  /** When the customer approved the project in that round; null unless it is `approved`. */
  approvedAt: string | null;
  /** Round steps in the project's track. */
  included: number;
  /** Rounds handed over so far. */
  used: number;
}
