import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileObjectService } from "@/server/shared/files/file-object-service";
import { fileAccessService } from "../services/files/file-access-service";
import { fileSchemas } from "../services/files/file-schemas";

/** Releases only an unfinished upload owned by this workspace member. */
export async function cancelFileUpload(
  id: string,
  actor: WorkspaceActor,
): Promise<FileResult<{ cancelled: true }>> {
  if (!fileSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesWrite,
    );
    if (
      !row ||
      row.orphaned_at ||
      row.status !== FileStatus.Pending ||
      row.source !== FileSource.Upload ||
      row.uploaded_by_member_id !== actor.workspaceMemberId
    )
      return { ok: false, code: E.NotFound };
    if (!(await fileObjectService.remove(tx, row)))
      return { ok: false, code: E.StorageUnavailable };
    return { ok: true, value: { cancelled: true } };
  });
}
