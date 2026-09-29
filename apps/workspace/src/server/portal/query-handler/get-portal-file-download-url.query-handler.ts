import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { fileDownloadUrl } from "@/common/patterns/files/file-download-url";
import { portalFileDownloadEndpoint } from "@/common/patterns/portal/portal-api-endpoints";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";

/** Internal, foreign, pending and hidden-project ids all answer the same `not found`. */
export async function getPortalFileDownloadUrl(
  reader: PortalReader,
  id: string,
  disposition: StorageDisposition,
): Promise<FileResult<{ url: string }>> {
  const row = await portalFileService.findVisibleUpload(reader, id);
  const url = row
    ? await fileObjectService.createDownloadUrl(
        row,
        disposition,
        fileDownloadUrl(
          portalFileDownloadEndpoint(reader.customerId, row.id),
          disposition,
        ),
      )
    : null;
  return url ? { ok: true, value: { url } } : { ok: false, code: E.NotFound };
}
