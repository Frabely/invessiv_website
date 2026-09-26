export const MessageErrorCode = {
  NotFound: "NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Forbidden: "FORBIDDEN",
  VersionConflict: "VERSION_CONFLICT",
  Internal: "INTERNAL",
} as const;
export type MessageErrorCode =
  (typeof MessageErrorCode)[keyof typeof MessageErrorCode];
