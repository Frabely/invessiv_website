import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { files } from "@invessiv/db/record-configuration";

/** Maps only released columns; visibility, uploader ids and storage coordinates stay internal. */
function toDto(
  row: typeof files.$inferSelect,
  projectTitle: string | null,
): PortalFileDto {
  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.project_id ? projectTitle : null,
    source: row.source,
    assetKind: row.asset_kind,
    displayName: row.display_name,
    note: row.note,
    origin:
      row.uploaded_by_side === UploadSide.Customer
        ? PortalFileOrigin.FromYou
        : PortalFileOrigin.FromUs,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    url: row.url,
    createdAt: row.created_at.toISOString(),
  };
}

export const portalFileMappingService = { toDto };
