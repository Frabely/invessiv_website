import type { AssetKind } from "../../constants/files/asset-kind";
import type { UploadQueueItemStatus } from "../../constants/files/upload-queue-item-status";
import type { UploadQueueErrorCode } from "./upload-queue-error-code";

export interface UploadQueueItem {
  /** Local identifier; unrelated to the server file id. */
  id: string;
  name: string;
  size: number;
  /** Null while rejected by the browser check. */
  assetKind: AssetKind | null;
  status: UploadQueueItemStatus;
  /** Transfer progress between 0 and 1. */
  progress: number;
  errorCode: UploadQueueErrorCode | null;
  /** False when a retry cannot succeed, e.g. after a content check refused the file. */
  retryable: boolean;
}
