import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileRow } from "./file-object-service-types";

type FilePresentationFields = Pick<
  FileDto,
  | "id"
  | "displayName"
  | "assetKind"
  | "source"
  | "extension"
  | "sizeBytes"
  | "url"
  | "note"
  | "createdAt"
>;

/** Only fields released in CRM, portal and feedback file presentation DTOs. */
function toFields(row: FileRow): FilePresentationFields {
  return {
    id: row.id,
    displayName: row.display_name,
    assetKind: row.asset_kind,
    source: row.source,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    url: row.url,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

export const filePresentationMappingService = { toFields } as const;
