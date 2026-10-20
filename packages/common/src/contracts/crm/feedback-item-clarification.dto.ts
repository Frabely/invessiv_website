import type { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
/** Public clarification history; never contains actor or command identifiers. */
export type FeedbackItemClarificationDto = {
  /** Stable clarification id used for answering and closing. */
  id: string;
  /** Whether the question still awaits an answer or has ended. */
  status: FeedbackClarificationStatus;
  /** Immutable question, published immediately. */
  question: string;
  /** ISO timestamp when the team asked the question. */
  requestedAt: string;
  /** Customer response; null until answered, also null when closed internally. */
  answer: string | null;
  /** ISO response timestamp, null when not answered. */
  answeredAt: string | null;
  /** Team explanation for closing without a response, otherwise null. */
  closeNote: string | null;
  /** ISO closure timestamp, null when not closed internally. */
  closedAt: string | null;
};
