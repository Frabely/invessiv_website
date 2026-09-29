import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";

/** Releases only the caller's unfinished upload; ready files are never removable in the portal. */
export async function cancelPortalFileUpload(
  actor: PortalActor,
  id: string,
): Promise<FileResult<{ cancelled: true }>> {
  if (!portalFileService.canWrite(actor))
    return { ok: false, code: E.NotFound };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await portalFileService.lockOwnUpload(tx, actor, id);
    if (!row) return { ok: false, code: E.NotFound };
    return fileObjectService.cancelPending(tx, row);
  });
}
