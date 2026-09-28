import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileActivityService } from "../services/files/file-activity-service";
import { fileService } from "../services/files/file-service";

export async function deleteFile(
  id: string,
  input: VersionedWriteInput,
  actor: WorkspaceActor,
): Promise<FileResult<{ deleted: true }>> {
  if (!fileSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.delete.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesDelete,
    );
    if (!row || row.status !== FileStatus.Ready)
      return { ok: false, code: E.NotFound };
    if (row.version !== parsed.data.version) return fileService.conflict(row);
    if (!(await fileService.remove(tx, row)))
      return { ok: false, code: E.StorageUnavailable };
    await fileActivityService.record(tx, row, actor, ActivityType.FieldChange, [
      "deleted",
    ]);
    return { ok: true, value: { deleted: true } };
  });
}
