import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { CreatePortalFileUploadRequestDto } from "@invessiv/common/contracts/portal/create-portal-file-upload-request.dto";
import type { PortalFileUploadTicketResponseDto } from "@invessiv/common/contracts/portal/portal-file-upload-ticket-response.dto";
import { classifyUploadCandidate } from "@invessiv/common/patterns/files/classify-upload-candidate";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";

/** A customer upload is always visible to the customer; the table enforces the same rule. */
export async function createPortalFileUpload(
  actor: PortalActor,
  input: CreatePortalFileUploadRequestDto,
): Promise<FileResult<PortalFileUploadTicketResponseDto>> {
  if (!portalFileService.canWrite(actor))
    return { ok: false, code: E.NotFound };
  const parsed = portalFileSchemas.upload.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  const candidate = classifyUploadCandidate({
    name: data.displayName,
    size: data.sizeBytes,
  });
  if (!candidate.ok) return candidate;
  const projectId = data.projectId ?? null;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    if (!(await portalFileService.targetExists(tx, actor, projectId)))
      return { ok: false, code: E.NotFound };
    if (!(await portalFileService.lockMembership(tx, actor)))
      return { ok: false, code: E.NotFound };
    const issued = await fileObjectService.issueUpload(
      tx,
      {
        customerId: actor.customerId,
        projectId,
        displayName: data.displayName,
        sizeBytes: data.sizeBytes,
        note: data.note ?? null,
        visibleToCustomer: true,
        uploader: {
          side: UploadSide.Customer,
          memberId: null,
          portalMembershipId: actor.membershipId,
        },
      },
      candidate,
    );
    if (!issued.ok) return issued;
    // The pending entry is echoed back only to its uploader; the title is not needed yet.
    return {
      ok: true,
      value: {
        file: portalFileMappingService.toDto(issued.value.row, null),
        ticket: issued.value.ticket,
      },
    };
  });
}
