import { FileErrorCode } from "../../constants/files/file-error-code";
import {
  MAX_UPLOAD_BATCH_BYTES,
  MAX_UPLOAD_FILES,
  UPLOAD_LIMIT_BY_KIND,
} from "../../constants/files/upload-limits";
import { UPLOAD_CONTENT_TYPES } from "../../constants/files/upload-content-types";
import type { UploadExtension } from "../../constants/files/upload-extension";
import type { UploadCandidate } from "../../contracts/files/upload-candidate";
import type { UploadClassification } from "../../contracts/files/upload-classification";

export function classifyUploadCandidate(
  file: UploadCandidate,
): UploadClassification {
  const leaf = file.name.split(/[\\/]/).pop() ?? "";
  const extension = leaf.split(".").pop()?.toLowerCase();
  if (
    !leaf.includes(".") ||
    !extension ||
    !Object.hasOwn(UPLOAD_CONTENT_TYPES, extension)
  )
    return { ok: false, code: FileErrorCode.UnsupportedExtension };
  if (!Number.isSafeInteger(file.size) || file.size <= 0)
    return { ok: false, code: FileErrorCode.InvalidSize };
  for (const [assetKind, limits] of Object.entries(UPLOAD_LIMIT_BY_KIND)) {
    const maxBytes = (limits as Record<string, number>)[extension];
    if (maxBytes !== undefined) {
      if (file.size > maxBytes)
        return { ok: false, code: FileErrorCode.TooLarge };
      return {
        ok: true,
        assetKind: assetKind as keyof typeof UPLOAD_LIMIT_BY_KIND,
        extension: extension as UploadExtension,
        contentType: UPLOAD_CONTENT_TYPES[extension as UploadExtension],
        maxBytes,
      };
    }
  }
  return { ok: false, code: FileErrorCode.UnsupportedExtension };
}

export function validateUploadBatch(
  files: readonly UploadCandidate[],
): FileErrorCode | null {
  if (files.length > MAX_UPLOAD_FILES) return FileErrorCode.TooManyFiles;
  let total = 0;
  for (const file of files) {
    const result = classifyUploadCandidate(file);
    if (!result.ok) return result.code;
    total += file.size;
  }
  return total > MAX_UPLOAD_BATCH_BYTES ? FileErrorCode.BatchTooLarge : null;
}
