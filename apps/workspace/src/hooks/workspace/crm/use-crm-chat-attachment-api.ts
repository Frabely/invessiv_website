"use client";

import { useMemo } from "react";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { ConversationAttachmentAccessDto } from "@invessiv/common/contracts/crm/conversation-attachment-access.dto";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filesApiService } from "@/client/crm/files-api-service";
import type { ChatAttachmentApi } from "@/common/contracts/files/chat-attachment-api";
import { mapPagedFiles } from "@/common/patterns/files/map-paged-files";
import { toComposerAttachment } from "@/common/patterns/files/to-composer-attachment";

/** An internal entry is released on send; the composer says so before the message leaves. */
function toAttachment(file: FileDto) {
  return toComposerAttachment(file, !file.visibleToCustomer);
}

/**
 * The CRM's file access for the customer chat. Chat uploads land customer-wide and internal;
 * sending the message releases them together with every other internal attachment.
 */
export function useCrmChatAttachmentApi(
  customerId: string,
  access: ConversationAttachmentAccessDto | null,
): ChatAttachmentApi<FileDto> {
  const pick = access?.pick ?? false;
  const upload = access?.upload ?? false;
  return useMemo(
    () => ({
      listFiles: pick
        ? async (page, search) =>
            mapPagedFiles(
              await filesApiService.listFiles(customerId, {
                page,
                search: search || undefined,
              }),
              toAttachment,
            )
        : null,
      searchable: true,
      upload: upload
        ? {
            transport: filesApiService.uploadTransport(customerId, {
              projectId: null,
              visibleToCustomer: false,
              note: null,
            }),
            toAttachment,
          }
        : null,
      getDownloadUrl: (fileId) =>
        filesApiService.getDownloadUrl(fileId, StorageDisposition.Attachment),
    }),
    [customerId, pick, upload],
  );
}
