import type { FeedbackItemClarificationDto } from "./feedback-item-clarification.dto";
export type FeedbackItemInternalClarificationDto =
  FeedbackItemClarificationDto & {
    /** Current team display name; null if unavailable. */
    requestedByName: string | null;
    /** Current customer display name; null before answering or after membership removal. */
    answeredByName: string | null;
    /** Current closing member name; null before closure or if unavailable. */
    closedByName: string | null;
  };
