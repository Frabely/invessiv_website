import type { FileApiErrorCode } from "../../constants/files/file-api-error-code";
import type { FileErrorCode } from "../../constants/files/file-error-code";

/** Every reason a file API operation can fail: the request-shape check, or the API's own refusal. */
export type FileOperationErrorCode = FileApiErrorCode | FileErrorCode;
