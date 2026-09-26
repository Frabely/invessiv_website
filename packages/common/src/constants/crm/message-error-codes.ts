export const MessageErrorCode = {
  NotFound: "NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Forbidden: "FORBIDDEN",
  VersionConflict: "VERSION_CONFLICT",
  Internal: "INTERNAL",
} as const;
export type MessageErrorCode =
  (typeof MessageErrorCode)[keyof typeof MessageErrorCode];
export const MESSAGE_ERROR_CODE_VALUES = [
  MessageErrorCode.NotFound,
  MessageErrorCode.ValidationError,
  MessageErrorCode.Forbidden,
  MessageErrorCode.VersionConflict,
  MessageErrorCode.Internal,
] as const;
