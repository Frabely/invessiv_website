import type { InternalQueueFeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";

/** One round of the internal feedback inbox: a round the team has to act on. */
export interface FeedbackInboxItemDto {
  /** Round identifier; opens the round in the customer cockpit. */
  id: string;
  /** Position in the project's track, starting at 1. */
  roundNumber: number;
  /** Always one of the statuses where the team is on turn. */
  status: InternalQueueFeedbackRoundStatus;
  /** Customer the project belongs to. */
  customerId: string;
  /** Current customer name. */
  customerDisplayName: string;
  /** Project the round belongs to. */
  projectId: string;
  /** Current project title. */
  projectTitle: string;
  /** When the customer submitted the round. */
  submittedAt: string;
  /** Requested feedback date as `YYYY-MM-DD`; null when none was set. */
  dueOn: string | null;
  /** Number of feedback items. */
  itemCount: number;
  /** Attachments the viewer may read; zero without `files.read`. */
  fileCount: number;
  /** Start of the first item's text as plain text; null when the first item is empty. */
  excerpt: string | null;
  /** Submitted and not yet opened by any member. */
  unread: boolean;
}
