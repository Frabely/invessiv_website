import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { FileDownload } from "@/server/shared/files/file-object-service-types";
import { fileObjectService } from "@/server/shared/files/file-object-service";
import { fileService } from "../services/files/file-service";

export async function downloadFile(
  id: string,
  actor: WorkspaceActor,
): Promise<FileResult<FileDownload>> {
  const row = await fileService.findReadable(id, actor);
  const download = row ? await fileObjectService.openDownload(row) : null;
  return download
    ? { ok: true, value: download }
    : { ok: false, code: E.NotFound };
}
