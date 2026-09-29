import type { FileDto } from "./file.dto";

/** What the preview needs of an entry; both the CRM and the portal DTO satisfy it. */
export type FilePreviewItem = Pick<
  FileDto,
  "id" | "displayName" | "source" | "extension" | "sizeBytes"
>;
