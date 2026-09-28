export const UploadQueueItemStatus = {
  /** Selected and accepted by the browser check, waiting for the batch to start. */
  Staged: "staged",
  /** Refused by the browser check; never sent to the server. */
  Rejected: "rejected",
  Queued: "queued",
  Uploading: "uploading",
  Finalizing: "finalizing",
  Done: "done",
  Failed: "failed",
  Cancelled: "cancelled",
} as const;
export type UploadQueueItemStatus =
  (typeof UploadQueueItemStatus)[keyof typeof UploadQueueItemStatus];
