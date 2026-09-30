import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { PortalFeedbackClientFailure } from "./portal-feedback-client-failure";

/** Attaching and detaching answer with the one file entry. */
export type PortalFeedbackAttachmentClientResult =
  { ok: true; attachment: FeedbackAttachmentDto } | PortalFeedbackClientFailure;
