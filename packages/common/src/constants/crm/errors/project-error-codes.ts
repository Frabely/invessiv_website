export const ProjectErrorCode = {
  NotFound: "PROJECT_NOT_FOUND",
  ValidationError: "PROJECT_VALIDATION_ERROR",
} as const;

export type ProjectErrorCode =
  (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode];

export const PROJECT_ERROR_CODE_VALUES = Object.values(
  ProjectErrorCode,
) as readonly ProjectErrorCode[];
