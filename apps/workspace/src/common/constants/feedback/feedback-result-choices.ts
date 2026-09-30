import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";

/**
 * What the result select offers. `Pending` only stands for "no result yet" while an item is
 * unrated; a result can be replaced but never taken back, so it is not offered once one is set.
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
