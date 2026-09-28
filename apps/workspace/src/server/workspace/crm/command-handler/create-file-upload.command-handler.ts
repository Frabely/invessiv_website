import "server-only";
import { and, count, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import {
  MAX_UPLOAD_FILES,
  UPLOAD_URL_TTL_MS,
} from "@invessiv/common/constants/files/upload-limits";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import type { CreateFileUploadRequestDto } from "@invessiv/common/contracts/files/create-file-upload-request.dto";
import { classifyUploadCandidate } from "@invessiv/common/patterns/files/classify-upload-candidate";
import { createFileStorageKey } from "@invessiv/common/patterns/files/safe-filename";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files, workspaceMembers } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { storageService } from "@/server/shared/files/storage-service";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileMappingService } from "../services/files/file-mapping-service";

export async function createFileUpload(
  customerId: string,
  input: CreateFileUploadRequestDto,
  actor: WorkspaceActor,
): Promise<FileResult<{ file: FileDto; ticket: StorageUploadTicket }>> {
  if (!fileSchemas.id.safeParse(customerId).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.upload.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  const candidate = classifyUploadCandidate({
    name: data.displayName,
    size: data.sizeBytes,
  });
  if (!candidate.ok) return candidate;
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
    // Serializes ticket issuance across customers and parallel requests by the same actor.
    const [member] = await tx
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, actor.workspaceMemberId),
          eq(workspaceMembers.active, true),
        ),
      )
      .for("update");
    if (!member) return { ok: false, code: E.NotFound };
    const [pending] = await tx
      .select({ count: count() })
      .from(files)
      .where(
        and(
          eq(files.uploaded_by_member_id, actor.workspaceMemberId),
          eq(files.status, FileStatus.Pending),
        ),
      );
    if (pending.count >= MAX_UPLOAD_FILES)
      return { ok: false, code: E.PendingLimit };
    const id = crypto.randomUUID();
    const key = createFileStorageKey(customerId, id, data.displayName);
    // Signing happens before the insert; a failed signature never consumes a pending slot.
    const ticket = await storageService.getAdapter().createUploadUrl(key, {
      contentType: candidate.contentType,
      maxBytes: candidate.maxBytes,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_MS),
    });
    const [row] = await tx
      .insert(files)
      .values({
        id,
        customer_id: customerId,
        project_id: data.projectId ?? null,
        source: FileSource.Upload,
        status: FileStatus.Pending,
        asset_kind: candidate.assetKind,
        display_name: data.displayName,
        note: data.note ?? null,
        visible_to_customer: data.visibleToCustomer ?? false,
        uploaded_by_side: UploadSide.Internal,
        uploaded_by_member_id: actor.workspaceMemberId,
        storage_key: key,
        content_type: candidate.contentType,
        extension: candidate.extension,
        size_bytes: data.sizeBytes,
        inspection_status: FileInspectionStatus.Unscanned,
        version: 1,
      })
      .returning();
    return { ok: true, value: { file: fileMappingService.toDto(row), ticket } };
  });
}
