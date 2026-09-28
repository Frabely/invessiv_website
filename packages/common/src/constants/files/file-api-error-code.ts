export const FileApiErrorCode = {
  NotFound: "FILE_NOT_FOUND",
  Validation: "FILE_VALIDATION_ERROR",
  PendingLimit: "FILE_PENDING_LIMIT",
  CustomerVisibility: "FILE_CUSTOMER_VISIBILITY",
  UploadOwner: "FILE_UPLOAD_OWNER",
  NotUpload: "FILE_NOT_UPLOAD",
  StorageUnavailable: "FILE_STORAGE_UNAVAILABLE",
  Internal: "FILE_INTERNAL",
} as const;
export type FileApiErrorCode =
  (typeof FileApiErrorCode)[keyof typeof FileApiErrorCode];
