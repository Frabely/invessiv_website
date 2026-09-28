import type { files } from "@invessiv/db/record-configuration";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";

function toDto(row: typeof files.$inferSelect): FileDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    projectId: row.project_id,
    source: row.source,
    status: row.status,
    assetKind: row.asset_kind,
    displayName: row.display_name,
    note: row.note,
    visibleToCustomer: row.visible_to_customer,
    uploadedBySide: row.uploaded_by_side,
    uploadedByMemberId: row.uploaded_by_member_id,
    uploadedByPortalMembershipId: row.uploaded_by_portal_membership_id,
    contentType: row.content_type,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    inspectionStatus: row.inspection_status,
    url: row.url,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const fileMappingService = { toDto };
