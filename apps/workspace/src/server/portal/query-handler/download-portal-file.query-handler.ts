import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import type { FileDownload } from "@/server/shared/files/file-object-service-types";
import { fileObjectService } from "@/server/shared/files/file-object-service";

export async function downloadPortalFile(
  reader: PortalReader,
  id: string,
): Promise<FileResult<FileDownload>> {
  const row = await portalFileService.findVisibleUpload(reader, id);
  const download = row ? await fileObjectService.openDownload(row) : null;
  return download
    ? { ok: true, value: download }
    : { ok: false, code: E.NotFound };
}
