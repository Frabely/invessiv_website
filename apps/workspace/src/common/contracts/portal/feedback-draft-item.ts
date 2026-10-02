import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackDraftItemDto } from "@invessiv/common/contracts/portal/portal-feedback-draft-item.dto";

/**
 * One item as the feedback sheet holds it: the saved draft fields plus its files. Files are hung
 * on through their own endpoint, so a draft save never sends them.
 */
export type FeedbackDraftItem = PortalFeedbackDraftItemDto & {
  attachments: FileAttachmentDto[];
};
