import "server-only";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import type { FeedbackAttachmentRow } from "./feedback-service-types";

/** Feedback attachments are finished customer uploads; a missing size only shows up as 0 bytes. */
function toAttachmentDto(row: FeedbackAttachmentRow): FeedbackAttachmentDto {
  return {
    fileId: row.fileId,
    displayName: row.displayName,
    assetKind: row.assetKind,
    sizeBytes: row.sizeBytes ?? 0,
  };
}

/** The same attachment from a full file row, as attach and detach hold it. */
function fileToAttachmentDto(row: FileRow): FeedbackAttachmentDto {
  return toAttachmentDto({
    fileId: row.id,
    displayName: row.display_name,
    assetKind: row.asset_kind,
    sizeBytes: row.size_bytes,
  });
}

export const feedbackMappingService = {
  toAttachmentDto,
  fileToAttachmentDto,
} as const;
