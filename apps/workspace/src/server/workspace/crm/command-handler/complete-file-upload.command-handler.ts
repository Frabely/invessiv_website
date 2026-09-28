import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { storageService } from "@/server/shared/files/storage-service";
import { fileValidationService } from "@/server/shared/files/file-validation-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileActivityService } from "../services/files/file-activity-service";
import { fileMappingService } from "../services/files/file-mapping-service";
import { fileService } from "../services/files/file-service";

export async function completeFileUpload(
  id: string,
  actor: WorkspaceActor,
): Promise<FileResult<FileDto>> {
  if (!fileSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesWrite,
    );
    if (!row || row.orphaned_at) return { ok: false, code: E.NotFound };
    if (row.uploaded_by_member_id !== actor.workspaceMemberId)
      return { ok: false, code: E.NotFound };
    if (!row.storage_key || !row.extension || !row.size_bytes)
      return { ok: false, code: E.NotUpload };
    if (row.status === FileStatus.Ready)
      return { ok: true, value: fileMappingService.toDto(row) };
    const validation = await fileValidationService.validate(
      storageService.getAdapter(),
      {
        storageKey: row.storage_key,
        extension: row.extension,
        sizeBytes: row.size_bytes,
      },
    );
    if (!validation.ok) {
      if (!(await fileService.remove(tx, row)))
        return { ok: false, code: E.StorageUnavailable };
      return validation;
    }
    const write = await updateVersioned({
      tx,
      table: files,
      id,
      expectedVersion: row.version,
      patch: {
        status: FileStatus.Ready,
        inspection_status: validation.inspectionStatus,
      },
      toDto: fileMappingService.toDto,
    });
    if (!write.ok)
      throw new Error("Locked upload disappeared during completion");
    await fileActivityService.record(tx, row, actor, ActivityType.FileUploaded);
    return { ok: true, value: write.value };
  });
}
