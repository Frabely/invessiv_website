import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import type { FileClientResult } from "./file-client-result";
import type { PagedFiles } from "./paged-files";
import type { UploadQueueTransport } from "./upload-queue-transport";

/**
 * The side-specific file access of a chat (CRM or portal). Entries come back already shaped for
 * the composer; a missing capability is null, so the chat never offers what the viewer may not do.
 */
export type ChatAttachmentApi<TFile extends { id: string }> = {
  /** Existing entries the viewer may attach, newest first; null without the read permission. */
  listFiles:
    | ((
        page: number,
        search: string,
      ) => Promise<FileClientResult<PagedFiles<ComposerAttachment>>>)
    | null;
  /** Only the CRM list endpoint searches; the portal lists without a search field. */
  searchable: boolean;
  /** Customer-wide upload from the chat; null without the write permission. */
  upload: {
    transport: UploadQueueTransport<TFile>;
    toAttachment: (file: TFile) => ComposerAttachment;
  } | null;
  /** Short-lived download URL for an uploaded attachment. */
  getDownloadUrl: (fileId: string) => Promise<FileClientResult<string>>;
};
