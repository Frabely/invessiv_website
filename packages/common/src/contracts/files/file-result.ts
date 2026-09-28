import type { ConcurrencyErrorCode } from "../../constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "../concurrency/version-conflict.dto";
import type { FileDto } from "./file.dto";
import type { FileOperationErrorCode } from "./file-operation-error-code";

export type FileResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: FileOperationErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<FileDto>;
    };
