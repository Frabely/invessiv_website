import type { StorageUploadOptions } from "@invessiv/common/contracts/storage/storage-upload-options";
import type { StorageDownloadOptions } from "@invessiv/common/contracts/storage/storage-download-options";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import {
  DOWNLOAD_URL_TTL_MS,
  UPLOAD_URL_TTL_MS,
} from "@invessiv/common/constants/files/upload-limits";
import { StorageError } from "./storage-error";

export function validateKey(key: string): void {
  if (
    !key ||
    key.length > 1024 ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.split("/").some((part) => !part || part === "." || part === "..") ||
    Array.from(key).some(
      (char) => char.codePointAt(0)! < 32 || char.codePointAt(0) === 127,
    )
  )
    throw new StorageError(StorageErrorCode.InvalidInput);
}

function validateExpiry(date: Date, maxMs: number): void {
  const remaining = date.getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0 || remaining > maxMs)
    throw new StorageError(StorageErrorCode.InvalidInput);
}

export function validateUpload(
  key: string,
  options: StorageUploadOptions,
): void {
  validateKey(key);
  validateExpiry(options.expiresAt, UPLOAD_URL_TTL_MS);
  if (
    !Number.isSafeInteger(options.maxBytes) ||
    options.maxBytes <= 0 ||
    !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(options.contentType)
  )
    throw new StorageError(StorageErrorCode.InvalidInput);
}

export function validateDownload(
  key: string,
  options: StorageDownloadOptions,
): void {
  validateKey(key);
  validateExpiry(options.expiresAt, DOWNLOAD_URL_TTL_MS);
  if (
    !Object.values(StorageDisposition).includes(options.disposition) ||
    !options.filename ||
    /[\\/\r\n]/.test(options.filename)
  )
    throw new StorageError(StorageErrorCode.InvalidInput);
}

export function validateRange(key: string, start: number, end: number): void {
  validateKey(key);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start
  )
    throw new StorageError(StorageErrorCode.InvalidInput);
}
