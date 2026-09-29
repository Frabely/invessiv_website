export const FeedbackItemResult = {
  Implemented: "implemented",
  NotImplemented: "not_implemented",
  AdditionalService: "additional_service",
} as const;

export type FeedbackItemResult =
  (typeof FeedbackItemResult)[keyof typeof FeedbackItemResult];

export const FEEDBACK_ITEM_RESULT_VALUES = [
  FeedbackItemResult.Implemented,
  FeedbackItemResult.NotImplemented,
  FeedbackItemResult.AdditionalService,
] as const;

/** The customer is owed an explanation for these; a CHECK refuses them without a reply. */
export const FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE = [
  FeedbackItemResult.NotImplemented,
  FeedbackItemResult.AdditionalService,
] as const;
