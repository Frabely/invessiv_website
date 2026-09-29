import type { UploadQueueItemStatus } from "../../constants/files/upload-queue-item-status";
import type { UploadQueueErrorCode } from "../files/upload-queue-error-code";

/** Texts of one queued upload; `{name}` in the templates is replaced with the filename. */
export interface UploadQueueRowLabels {
  status: Record<UploadQueueItemStatus, string>;
  errors: Record<UploadQueueErrorCode, string>;
  progress: string;
  remove: string;
  cancelItem: string;
  retryItem: string;
}
