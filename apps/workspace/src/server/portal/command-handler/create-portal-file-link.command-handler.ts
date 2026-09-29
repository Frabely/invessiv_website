import "server-only";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { CreatePortalFileLinkRequestDto } from "@invessiv/common/contracts/portal/create-portal-file-link-request.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";

/** The server never fetches the URL: no title, no preview, no thumbnail. */
export async function createPortalFileLink(
  actor: PortalActor,
  input: CreatePortalFileLinkRequestDto,
): Promise<FileResult<PortalFileDto>> {
  if (!portalFileService.canWrite(actor))
    return { ok: false, code: E.NotFound };
  const parsed = portalFileSchemas.link.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  const projectId = data.projectId ?? null;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    if (!(await portalFileService.targetExists(tx, actor, projectId)))
      return { ok: false, code: E.NotFound };
    const row = await fileObjectService.createLink(tx, {
      customerId: actor.customerId,
      projectId,
      displayName: data.displayName,
      note: data.note ?? null,
      url: data.url,
      visibleToCustomer: true,
      uploader: {
        side: UploadSide.Customer,
        memberId: null,
        portalMembershipId: actor.membershipId,
      },
    });
    await fileObjectService.recordActivity(
      tx,
      row,
      portalActivityActor(actor),
      ActivityType.Created,
    );
    return { ok: true, value: portalFileMappingService.toDto(row, null) };
  });
}
