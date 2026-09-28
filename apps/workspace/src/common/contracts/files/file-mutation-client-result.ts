import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileWriteFailure } from "./file-write-failure";

export type FileMutationClientResult =
  { ok: true; file: FileDto } | FileWriteFailure;
