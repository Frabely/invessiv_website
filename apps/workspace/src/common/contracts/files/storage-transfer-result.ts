import type { UploadTransferErrorCode } from "@invessiv/common/constants/files/upload-transfer-error-code";

export type StorageTransferResult =
  | { ok: true }
  | { ok: false; aborted: true }
  | { ok: false; code: UploadTransferErrorCode };
