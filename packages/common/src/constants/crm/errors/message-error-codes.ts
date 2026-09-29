export const MessageErrorCode = {
  NotFound: "NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Forbidden: "FORBIDDEN",
  VersionConflict: "VERSION_CONFLICT",
  RateLimited: "RATE_LIMITED",
  AttachmentReleaseRequired: "ATTACHMENT_RELEASE_REQUIRED",
  AttachmentUnavailable: "ATTACHMENT_UNAVAILABLE",
  Internal: "INTERNAL",
} as const;
export type MessageErrorCode =
  (typeof MessageErrorCode)[keyof typeof MessageErrorCode];
export const MESSAGE_ERROR_CODE_VALUES = [
  MessageErrorCode.NotFound,
  MessageErrorCode.ValidationError,
  MessageErrorCode.Forbidden,
  MessageErrorCode.VersionConflict,
  MessageErrorCode.RateLimited,
  MessageErrorCode.AttachmentReleaseRequired,
  MessageErrorCode.AttachmentUnavailable,
  MessageErrorCode.Internal,
] as const;
