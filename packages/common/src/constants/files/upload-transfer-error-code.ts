/** Failures of the direct browser-to-storage transfer, outside every API response. */
export const UploadTransferErrorCode = {
  Network: "UPLOAD_NETWORK",
  Refused: "UPLOAD_REFUSED",
} as const;
export type UploadTransferErrorCode =
  (typeof UploadTransferErrorCode)[keyof typeof UploadTransferErrorCode];
