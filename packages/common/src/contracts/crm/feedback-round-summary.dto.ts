import type { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";

/** One row of a project's round list, without item texts. */
export interface FeedbackRoundSummaryDto {
  /** Round identifier for opening the detail. */
  id: string;
  /** Position in the project's track, starting at 1. */
  roundNumber: number;
  /** Lifecycle state of the round. */
  status: FeedbackRoundStatus;
  /** When the round was handed over. */
  handedOverAt: string;
  /** HTTPS preview of that handover; the next handover starts from the latest one. */
  previewUrl: string | null;
  /** Requested feedback date as `YYYY-MM-DD`; null when none was set. */
  dueOn: string | null;
  /** When the customer submitted; null while unsubmitted. */
  submittedAt: string | null;
  /** When the team completed the round; null before `completed`. */
  completedAt: string | null;
  /** When the customer approved; null unless `approved`. */
  approvedAt: string | null;
  /** Number of feedback items, including empty draft items. */
  itemCount: number;
  /** Submitted and not yet opened by any member. */
  unread: boolean;
}
