import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { CreateFileLinkRequestDto } from "@invessiv/common/contracts/files/create-file-link-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileActivityService } from "../services/files/file-activity-service";
import { fileMappingService } from "../services/files/file-mapping-service";

export async function createFileLink(
  customerId: string,
  input: CreateFileLinkRequestDto,
  actor: WorkspaceActor,
): Promise<FileResult<FileDto>> {
  if (!fileSchemas.id.safeParse(customerId).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.link.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    if (
      !(await fileAccessService.targetExists(
        tx,
        customerId,
        data.projectId ?? null,
        actor,
        Permission.FilesWrite,
      ))
    )
      return { ok: false, code: E.NotFound };
    const [row] = await tx
      .insert(files)
      .values({
        id: crypto.randomUUID(),
        customer_id: customerId,
        project_id: data.projectId ?? null,
        source: FileSource.Link,
        status: FileStatus.Ready,
        asset_kind: AssetKind.Link,
        display_name: data.displayName,
        note: data.note ?? null,
        url: data.url,
        visible_to_customer: data.visibleToCustomer ?? false,
        uploaded_by_side: UploadSide.Internal,
        uploaded_by_member_id: actor.workspaceMemberId,
        version: 1,
      })
      .returning();
    await fileActivityService.record(tx, row, actor, ActivityType.Created);
    return { ok: true, value: fileMappingService.toDto(row) };
  });
}
