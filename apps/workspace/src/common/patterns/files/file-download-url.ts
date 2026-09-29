import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { FileQueryParam } from "@/common/constants/files/file-query-params";

/** Keeps the requested disposition when a signed URL falls back to the authenticated proxy. */
export function fileDownloadUrl(
  endpoint: string,
  disposition: StorageDisposition,
): string {
  return `${endpoint}?${new URLSearchParams({
    [FileQueryParam.Disposition]: disposition,
  })}`;
}
