import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";

/**
 * What the result select offers. `Pending` maps to null and can reset an existing result
 * while the round is editable.
 */
export const FeedbackResultChoice = {
  Pending: "pending",
  ...FeedbackItemResult,
} as const;

export type FeedbackResultChoice =
  (typeof FeedbackResultChoice)[keyof typeof FeedbackResultChoice];

export const FEEDBACK_RESULT_CHOICE_VALUES = [
  FeedbackResultChoice.Pending,
  FeedbackResultChoice.Implemented,
  FeedbackResultChoice.NotImplemented,
  FeedbackResultChoice.AdditionalService,
] as const;
