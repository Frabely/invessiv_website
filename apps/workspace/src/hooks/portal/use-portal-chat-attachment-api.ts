"use client";

import { useMemo } from "react";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { ConversationAttachmentAccessDto } from "@invessiv/common/contracts/crm/conversation-attachment-access.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { ChatAttachmentApi } from "@/common/contracts/files/chat-attachment-api";
import { mapPagedFiles } from "@/common/patterns/files/map-paged-files";
import { toComposerAttachment } from "@/common/patterns/files/to-composer-attachment";

/** Everything the portal lists is already visible to the customer; nothing is released. */
function toAttachment(file: PortalFileDto) {
  return toComposerAttachment(file, false);
}

/** The portal's file access for the chat; a chat upload lands under "From you" like any other. */
export function usePortalChatAttachmentApi(
  customerId: string,
  access: ConversationAttachmentAccessDto | null,
): ChatAttachmentApi<PortalFileDto> {
  const pick = access?.pick ?? false;
  const upload = access?.upload ?? false;
  return useMemo(
    () => ({
      listFiles: pick
        ? async (page) =>
            mapPagedFiles(
              await portalFilesApiService.listFiles(customerId, null, page),
              toAttachment,
            )
        : null,
      searchable: false,
      upload: upload
        ? {
            transport: portalFilesApiService.uploadTransport(customerId, {
              projectId: null,
              note: null,
            }),
            toAttachment,
          }
        : null,
      getDownloadUrl: (fileId) =>
        portalFilesApiService.getDownloadUrl(
          customerId,
          fileId,
          StorageDisposition.Attachment,
        ),
    }),
    [customerId, pick, upload],
  );
}
