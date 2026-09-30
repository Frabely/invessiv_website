import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { files } from "@invessiv/db/record-configuration";
import { filePresentationMappingService } from "@/server/shared/files/file-presentation-mapping-service";

/** Maps only released columns; visibility, uploader ids and storage coordinates stay internal. */
function toDto(
  row: typeof files.$inferSelect,
  projectTitle: string | null,
): PortalFileDto {
  return {
    ...filePresentationMappingService.toFields(row),
    projectId: row.project_id,
    projectTitle: row.project_id ? projectTitle : null,
    origin:
      row.uploaded_by_side === UploadSide.Customer
        ? PortalFileOrigin.FromYou
        : PortalFileOrigin.FromUs,
  };
}

export const portalFileMappingService = { toDto };
