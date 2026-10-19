import { FeedbackItemResult } from "./feedback-item-results";
export const FeedbackItemProcessingState = {
  Clarification: "clarification",
  Pending: "pending",
  ...FeedbackItemResult,
} as const;
export type FeedbackItemProcessingState =
  (typeof FeedbackItemProcessingState)[keyof typeof FeedbackItemProcessingState];
