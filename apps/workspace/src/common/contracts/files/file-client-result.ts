import type { FileClientErrorCode } from "./file-client-error-code";

export type FileClientResult<T> =
  { ok: true; value: T } | { ok: false; code: FileClientErrorCode };
