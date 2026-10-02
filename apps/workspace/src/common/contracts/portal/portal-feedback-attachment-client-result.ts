import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackClientFailure } from "./portal-feedback-client-failure";

/** Attaching and detaching answer with the one file entry. */
export type PortalFeedbackAttachmentClientResult =
  { ok: true; attachment: FileAttachmentDto } | PortalFeedbackClientFailure;
