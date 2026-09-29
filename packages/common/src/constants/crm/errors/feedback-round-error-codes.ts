export const FeedbackRoundErrorCode = {
  RoundNotFound: "FEEDBACK_ROUND_NOT_FOUND",
  ItemNotFound: "FEEDBACK_ITEM_NOT_FOUND",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  ProjectNotEligible: "PROJECT_NOT_ELIGIBLE",
  RoundStepMissing: "FEEDBACK_ROUND_STEP_MISSING",
  ProjectNotAtFeedbackStep: "PROJECT_NOT_AT_FEEDBACK_STEP",
  RoundAlreadyActive: "ROUND_ALREADY_ACTIVE",
  QuotaExhausted: "QUOTA_EXHAUSTED",
  ProjectAlreadyApproved: "PROJECT_ALREADY_APPROVED",
  InvalidTransition: "INVALID_TRANSITION",
  RoundLocked: "ROUND_LOCKED",
  ItemsRequired: "ITEMS_REQUIRED",
  ItemTextRequired: "ITEM_TEXT_REQUIRED",
  ItemsPresent: "ITEMS_PRESENT",
  ResultsIncomplete: "RESULTS_INCOMPLETE",
  NotLatestRound: "NOT_LATEST_ROUND",
  ConfirmationRequired: "CONFIRMATION_REQUIRED",
  AttachmentLimitReached: "ATTACHMENT_LIMIT_REACHED",
  FileNotAttachable: "FILE_NOT_ATTACHABLE",
  Internal: "INTERNAL",
} as const;

export type FeedbackRoundErrorCode =
  (typeof FeedbackRoundErrorCode)[keyof typeof FeedbackRoundErrorCode];

export const FEEDBACK_ROUND_ERROR_CODE_VALUES = Object.values(
  FeedbackRoundErrorCode,
) as readonly FeedbackRoundErrorCode[];
