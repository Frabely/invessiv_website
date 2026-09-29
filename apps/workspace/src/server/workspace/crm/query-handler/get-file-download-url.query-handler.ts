import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { crmFileDownloadEndpoint } from "@/common/patterns/crm/crm-api-endpoints";
import { fileDownloadUrl } from "@/common/patterns/files/file-download-url";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileObjectService } from "@/server/shared/files/file-object-service";
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
  const url = row
    ? await fileObjectService.createDownloadUrl(
        row,
        disposition,
        fileDownloadUrl(crmFileDownloadEndpoint(id), disposition),
      )
    : null;
  return url ? { ok: true, value: { url } } : { ok: false, code: E.NotFound };
}
