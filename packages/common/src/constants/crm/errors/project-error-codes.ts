export const ProjectErrorCode = {
  NotFound: "PROJECT_NOT_FOUND",
  ValidationError: "PROJECT_VALIDATION_ERROR",
  FeedbackRoundInUse: "PROJECT_FEEDBACK_ROUND_IN_USE",
  Internal: "PROJECT_INTERNAL",
} as const;

export type ProjectErrorCode =
  (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode];

export const PROJECT_ERROR_CODE_VALUES = Object.values(
  ProjectErrorCode,
) as readonly ProjectErrorCode[];
