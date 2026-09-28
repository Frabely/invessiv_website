import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { UpdateFileRequestDto } from "@invessiv/common/contracts/files/update-file-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileActivityService } from "../services/files/file-activity-service";
import { fileMappingService } from "../services/files/file-mapping-service";
import { fileService } from "../services/files/file-service";

export async function updateFile(
  id: string,
  input: UpdateFileRequestDto,
  actor: WorkspaceActor,
): Promise<FileResult<FileDto>> {
  if (!fileSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.update.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesWrite,
    );
    if (!row || row.status !== FileStatus.Ready || row.orphaned_at)
      return { ok: false, code: E.NotFound };
    if (row.version !== data.version) return fileService.conflict(row);
    if (
      data.visibleToCustomer !== undefined &&
      row.uploaded_by_side === UploadSide.Customer &&
      data.visibleToCustomer !== row.visible_to_customer
    )
      return { ok: false, code: E.CustomerVisibility };
    if (
      data.projectId !== undefined &&
      !(await fileAccessService.targetExists(
        tx,
        row.customer_id,
        data.projectId,
        actor,
        Permission.FilesWrite,
      ))
    )
      return { ok: false, code: E.NotFound };
    const patch = {
      ...(data.projectId !== undefined ? { project_id: data.projectId } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.visibleToCustomer !== undefined
        ? { visible_to_customer: data.visibleToCustomer }
        : {}),
    };
    const write = await updateVersioned({
      tx,
      table: files,
      id,
      expectedVersion: data.version,
      patch,
      toDto: fileMappingService.toDto,
    });
    if (!write.ok) throw new Error("Locked file disappeared during update");
    await fileActivityService.recordChanges(
      tx,
      row,
      { ...row, ...patch },
      actor,
    );
    return { ok: true, value: write.value };
  });
}
