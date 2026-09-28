import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { sanitizeFilename } from "@invessiv/common/patterns/files/safe-filename";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { storageService } from "@/server/shared/files/storage-service";
import { fileService } from "../services/files/file-service";

export async function downloadFile(
  id: string,
  actor: WorkspaceActor,
): Promise<
  FileResult<{
    stream: ReadableStream<Uint8Array>;
    filename: string;
    contentType: string;
  }>
> {
  const row = await fileService.findReadable(id, actor);
  if (!row?.storage_key || !row.content_type)
    return { ok: false, code: E.NotFound };
  return {
    ok: true,
    value: {
      stream: await storageService.getAdapter().openReadStream(row.storage_key),
      filename: sanitizeFilename(row.display_name),
      contentType: row.content_type,
    },
  };
}
