import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";
import { fileThumbnailService } from "@/server/shared/files/file-thumbnail-service";

/** Finishes the actor's own upload; a repeated call returns the ready entry unchanged. */
export async function completePortalFileUpload(
  actor: PortalActor,
  id: string,
): Promise<FileResult<PortalFileDto>> {
  if (!portalFileService.canWrite(actor))
    return { ok: false, code: E.NotFound };
  const result = await getDrizzleDatabaseClient().transaction(
    async (tx): Promise<FileResult<PortalFileDto>> => {
      const row = await portalFileService.lockOwnUpload(tx, actor, id);
      if (!row) return { ok: false, code: E.NotFound };
      const completed = await fileObjectService.completeUpload(
        tx,
        row,
        portalActivityActor(actor),
      );
      if (!completed.ok) return completed;
      return {
        ok: true,
        value: portalFileMappingService.toDto(completed.value, null, null),
      };
    },
  );
  if (result.ok) fileThumbnailService.schedule(result.value.id);
  return result;
}
