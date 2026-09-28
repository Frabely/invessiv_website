import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileClientErrorCode } from "./file-client-error-code";

/** A 409 carries the fresh entry so the dialog can keep the user's input. */
export type FileWriteFailure =
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: FileDto;
    }
  | { ok: false; code: FileClientErrorCode };
