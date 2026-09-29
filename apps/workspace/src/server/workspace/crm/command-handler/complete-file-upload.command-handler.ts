import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileObjectService } from "@/server/shared/files/file-object-service";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileMappingService } from "../services/files/file-mapping-service";

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
    if (!row || row.uploaded_by_member_id !== actor.workspaceMemberId)
      return { ok: false, code: E.NotFound };
    const completed = await fileObjectService.completeUpload(tx, row, {
      type: ActorType.User,
      userId: actor.userId,
    });
    if (!completed.ok) return completed;
    return { ok: true, value: fileMappingService.toDto(completed.value) };
  });
}
