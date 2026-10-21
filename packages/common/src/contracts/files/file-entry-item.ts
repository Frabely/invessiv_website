import type { FileDto } from "./file.dto";
import type { FilePreviewItem } from "./file-preview-item";

/**
 * What a file row or side panel shows of an entry; both the CRM and the portal DTO satisfy it.
 * The preview URL is optional because attachment DTOs (chat, feedback) carry none.
 */
export type FileEntryItem = FilePreviewItem &
  Pick<FileDto, "assetKind" | "note" | "url" | "createdAt"> &
  Partial<Pick<FileDto, "thumbnailUrl">>;
