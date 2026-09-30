/** Field-level codes of the handover dialog; the dialog maps each one to a message. */
export const FeedbackHandoverValidationCode = {
  PreviewUrlInvalid: "PREVIEW_URL_INVALID",
  DueOnPast: "DUE_ON_PAST",
} as const;

export type FeedbackHandoverValidationCode =
  (typeof FeedbackHandoverValidationCode)[keyof typeof FeedbackHandoverValidationCode];

export const FEEDBACK_HANDOVER_VALIDATION_CODE_VALUES = [
  FeedbackHandoverValidationCode.PreviewUrlInvalid,
  FeedbackHandoverValidationCode.DueOnPast,
] as const;
