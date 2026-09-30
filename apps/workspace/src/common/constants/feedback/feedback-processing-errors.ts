/** How the CRM words a failed status or result write; several server codes share one message. */
export const FeedbackProcessingError = {
  NotFound: "notFound",
  Changed: "changed",
  Locked: "locked",
  ResultsIncomplete: "resultsIncomplete",
  Validation: "validation",
  Internal: "internal",
} as const;

export type FeedbackProcessingError =
  (typeof FeedbackProcessingError)[keyof typeof FeedbackProcessingError];

export const FEEDBACK_PROCESSING_ERROR_VALUES = [
  FeedbackProcessingError.NotFound,
  FeedbackProcessingError.Changed,
  FeedbackProcessingError.Locked,
  FeedbackProcessingError.ResultsIncomplete,
  FeedbackProcessingError.Validation,
  FeedbackProcessingError.Internal,
] as const;
