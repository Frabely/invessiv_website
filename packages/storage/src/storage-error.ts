import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";

const messages: Record<StorageErrorCode, string> = {
  STORAGE_CONFIGURATION: "Private storage is not configured.",
  STORAGE_INVALID_INPUT: "Invalid storage request.",
  STORAGE_NOT_FOUND: "Storage object was not found.",
  STORAGE_UNAVAILABLE: "Storage operation failed.",
  STORAGE_INVALID_RANGE: "Storage returned an invalid byte range.",
  STORAGE_PROXY_REQUIRED:
    "This download requires an authenticated response proxy.",
};

export class StorageError extends Error {
  constructor(readonly code: StorageErrorCode) {
    super(messages[code]);
    this.name = "StorageError";
  }
}
