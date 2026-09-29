export const FileApiErrorCode = {
  NotFound: "FILE_NOT_FOUND",
  Validation: "FILE_VALIDATION_ERROR",
  ArchiveLimit: "FILE_ARCHIVE_LIMIT",
  ArchiveVideo: "FILE_ARCHIVE_VIDEO",
  PendingLimit: "FILE_PENDING_LIMIT",
  CustomerVisibility: "FILE_CUSTOMER_VISIBILITY",
  FeedbackBound: "FILE_FEEDBACK_BOUND",
  UploadOwner: "FILE_UPLOAD_OWNER",
  NotUpload: "FILE_NOT_UPLOAD",
  StorageUnavailable: "FILE_STORAGE_UNAVAILABLE",
  Internal: "FILE_INTERNAL",
} as const;
export type FileApiErrorCode =
  (typeof FileApiErrorCode)[keyof typeof FileApiErrorCode];
