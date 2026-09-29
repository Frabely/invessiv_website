import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { PagedFiles } from "@/common/contracts/files/paged-files";

/** Reshapes the entries of a list result and keeps paging and errors untouched. */
export function mapPagedFiles<TFrom, TTo>(
  result: FileClientResult<PagedFiles<TFrom>>,
  map: (file: TFrom) => TTo,
): FileClientResult<PagedFiles<TTo>> {
  if (!result.ok) return result;
  return {
    ok: true,
    value: { ...result.value, files: result.value.files.map(map) },
  };
}
