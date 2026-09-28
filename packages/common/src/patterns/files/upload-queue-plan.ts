import { FileApiErrorCode } from "../../constants/files/file-api-error-code";
import { FileErrorCode } from "../../constants/files/file-error-code";
import {
  MAX_UPLOAD_BATCH_BYTES,
  MAX_UPLOAD_FILES,
} from "../../constants/files/upload-limits";
import { UploadTransferErrorCode } from "../../constants/files/upload-transfer-error-code";
import type { UploadCandidate } from "../../contracts/files/upload-candidate";
import type { UploadClassification } from "../../contracts/files/upload-classification";
import type { UploadQueueErrorCode } from "../../contracts/files/upload-queue-error-code";
import { classifyUploadCandidate } from "./classify-upload-candidate";

const RETRYABLE_CODES: ReadonlySet<UploadQueueErrorCode> = new Set([
  FileApiErrorCode.PendingLimit,
  FileApiErrorCode.StorageUnavailable,
  FileApiErrorCode.Internal,
  UploadTransferErrorCode.Network,
  UploadTransferErrorCode.Refused,
]);

/**
 * Classifies a new selection against the files already accepted into the current batch. Files
 * beyond the count or byte budget are refused one by one, so the fitting part still uploads.
 */
function planSelection(
  candidates: readonly UploadCandidate[],
  accepted: { count: number; bytes: number },
): UploadClassification[] {
  let count = accepted.count;
  let bytes = accepted.bytes;
  return candidates.map((candidate) => {
    const result = classifyUploadCandidate(candidate);
    if (!result.ok) return result;
    if (count + 1 > MAX_UPLOAD_FILES)
      return { ok: false, code: FileErrorCode.TooManyFiles };
    if (bytes + candidate.size > MAX_UPLOAD_BATCH_BYTES)
      return { ok: false, code: FileErrorCode.BatchTooLarge };
    count += 1;
    bytes += candidate.size;
    return result;
  });
}

/** Content and policy refusals are final; only transient failures are worth a retry. */
function isRetryable(code: UploadQueueErrorCode): boolean {
  return RETRYABLE_CODES.has(code);
}

export const uploadQueuePlan = { planSelection, isRetryable };
