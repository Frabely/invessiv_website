import "server-only";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { filePresentationMappingService } from "@/server/shared/files/file-presentation-mapping-service";

/** Attachments keep the shape of the shared file row, so both sides render them alike. */
function toAttachmentDto(row: FileRow): FeedbackAttachmentDto {
  return filePresentationMappingService.toFields(row);
}

export const feedbackMappingService = {
  toAttachmentDto,
} as const;
