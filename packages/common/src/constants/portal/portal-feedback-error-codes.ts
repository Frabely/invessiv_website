export const PortalFeedbackErrorCode = {
  NotFound: "not_found",
  Locked: "locked",
  Validation: "validation",
  ItemsRequired: "items_required",
  ItemTextRequired: "item_text_required",
  ItemsPresent: "items_present",
  NotLatest: "not_latest",
  ConfirmationRequired: "confirmation_required",
  AttachmentLimit: "attachment_limit",
  NotAttachable: "not_attachable",
} as const;

export type PortalFeedbackErrorCode =
  (typeof PortalFeedbackErrorCode)[keyof typeof PortalFeedbackErrorCode];
