import "server-only";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";

/**
 * Finishes the actor's own upload. The row lock serializes parallel calls: a repeated call finds
 * the row ready and returns it without a second check or a second activity.
 */
export async function completePortalFileUpload(
  actor: PortalActor,
  id: string,
): Promise<FileResult<PortalFileDto>> {
  if (!portalFileService.canWrite(actor))
    return { ok: false, code: E.NotFound };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await portalFileService.lockOwnUpload(tx, actor, id);
    if (!row) return { ok: false, code: E.NotFound };
    const finalized = await fileObjectService.finalizeUpload(tx, row);
    if (!finalized.ok) return finalized;
    if (finalized.completed)
      await fileObjectService.recordActivity(
        tx,
        row,
        { type: ActorType.Customer, userId: actor.userId },
        ActivityType.FileUploaded,
      );
    return {
      ok: true,
      value: portalFileMappingService.toDto(finalized.row, null),
    };
  });
}
