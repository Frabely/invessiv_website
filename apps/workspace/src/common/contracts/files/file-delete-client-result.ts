import type { FileWriteFailure } from "./file-write-failure";

export type FileDeleteClientResult = { ok: true } | FileWriteFailure;
