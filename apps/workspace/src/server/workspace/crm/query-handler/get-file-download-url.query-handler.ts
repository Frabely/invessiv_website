import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { DOWNLOAD_URL_TTL_MS } from "@invessiv/common/constants/files/upload-limits";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { sanitizeFilename } from "@invessiv/common/patterns/files/safe-filename";
import { StorageError } from "@invessiv/storage";
import { crmFileDownloadEndpoint } from "@/common/patterns/crm/crm-api-endpoints";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { storageService } from "@/server/shared/files/storage-service";
import { fileSchemas } from "../services/files/file-schemas";
import { fileService } from "../services/files/file-service";

export async function getFileDownloadUrl(
  id: string,
  disposition: StorageDisposition,
  actor: WorkspaceActor,
): Promise<FileResult<{ url: string }>> {
  if (!fileSchemas.disposition.safeParse(disposition).success)
    return { ok: false, code: E.Validation };
  const row = await fileService.findReadable(id, actor);
  if (!row?.storage_key) return { ok: false, code: E.NotFound };
  try {
    const url = await storageService
      .getAdapter()
      .createDownloadUrl(row.storage_key, {
        expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_MS),
        disposition,
        filename: sanitizeFilename(row.display_name),
      });
    return { ok: true, value: { url } };
  } catch (error) {
    if (
      error instanceof StorageError &&
      error.code === StorageErrorCode.ProxyRequired
    ) {
      return {
        ok: true,
        value: { url: crmFileDownloadEndpoint(id) },
      };
    }
    throw error;
  }
}
