import type { files } from "@invessiv/db/record-configuration";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentationMappingService } from "@/server/shared/files/file-presentation-mapping-service";

/** The preview URL is signed by the caller after its visibility filter; the key stays internal. */
function toDto(
  row: typeof files.$inferSelect,
  thumbnailUrl: string | null,
): FileDto {
  return {
    ...filePresentationMappingService.toFields(row),
    customerId: row.customer_id,
    projectId: row.project_id,
    status: row.status,
    visibleToCustomer: row.visible_to_customer,
    uploadedBySide: row.uploaded_by_side,
    uploadedByMemberId: row.uploaded_by_member_id,
    uploadedByPortalMembershipId: row.uploaded_by_portal_membership_id,
    contentType: row.content_type,
    inspectionStatus: row.inspection_status,
    thumbnailUrl,
    version: row.version,
    updatedAt: row.updated_at.toISOString(),
  };
}

export const fileMappingService = { toDto };
