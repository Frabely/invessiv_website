import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import type { FileClientResult } from "./file-client-result";
import type { PagedFiles } from "./paged-files";
export type ChatFilePickerListFiles = (
  page: number,
  search: string,
) => Promise<FileClientResult<PagedFiles<ComposerAttachment>>>;
