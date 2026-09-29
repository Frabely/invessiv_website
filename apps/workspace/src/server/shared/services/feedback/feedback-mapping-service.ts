import "server-only";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
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

export const feedbackMappingService = {
  toAttachmentDto,
} as const;
