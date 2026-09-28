import type { UploadTransferErrorCode } from "../../constants/files/upload-transfer-error-code";
import type { FileOperationErrorCode } from "./file-operation-error-code";

/** Every reason a queued upload can stop: browser check, API or the storage transfer. */
export type UploadQueueErrorCode =
  FileOperationErrorCode | UploadTransferErrorCode;
