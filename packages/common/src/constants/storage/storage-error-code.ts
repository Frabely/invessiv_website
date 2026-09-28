export const StorageErrorCode = {
  Configuration: "STORAGE_CONFIGURATION",
  InvalidInput: "STORAGE_INVALID_INPUT",
  NotFound: "STORAGE_NOT_FOUND",
  Unavailable: "STORAGE_UNAVAILABLE",
  InvalidRange: "STORAGE_INVALID_RANGE",
  ProxyRequired: "STORAGE_PROXY_REQUIRED",
} as const;
export type StorageErrorCode =
  (typeof StorageErrorCode)[keyof typeof StorageErrorCode];
