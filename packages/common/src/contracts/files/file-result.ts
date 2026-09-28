import type { FileApiErrorCode } from "../../constants/files/file-api-error-code";
import type { FileErrorCode } from "../../constants/files/file-error-code";
import type { ConcurrencyErrorCode } from "../../constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "../concurrency/version-conflict.dto";
import type { FileDto } from "./file.dto";

export type FileResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: FileApiErrorCode | FileErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<FileDto>;
    };
