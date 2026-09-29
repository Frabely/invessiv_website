import "server-only";
import { and, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import type { CreateFileUploadRequestDto } from "@invessiv/common/contracts/files/create-file-upload-request.dto";
import { classifyUploadCandidate } from "@invessiv/common/patterns/files/classify-upload-candidate";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMembers } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileObjectService } from "@/server/shared/files/file-object-service";
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
    const issued = await fileObjectService.issueUpload(
      tx,
      {
        customerId,
        projectId: data.projectId ?? null,
        displayName: data.displayName,
        sizeBytes: data.sizeBytes,
        note: data.note ?? null,
        visibleToCustomer: data.visibleToCustomer ?? false,
        uploader: {
          side: UploadSide.Internal,
          memberId: actor.workspaceMemberId,
          portalMembershipId: null,
        },
      },
      candidate,
    );
    if (!issued.ok) return issued;
    return {
      ok: true,
      value: {
        file: fileMappingService.toDto(issued.value.row),
        ticket: issued.value.ticket,
      },
    };
  });
}
