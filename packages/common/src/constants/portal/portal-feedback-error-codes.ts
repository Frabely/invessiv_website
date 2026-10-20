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
  ClarificationNotOpen: "clarification_not_open",
  CommandIdReused: "command_id_reused",
  Unavailable: "unavailable",
} as const;

export type PortalFeedbackErrorCode =
  (typeof PortalFeedbackErrorCode)[keyof typeof PortalFeedbackErrorCode];

export const PORTAL_FEEDBACK_ERROR_CODE_VALUES = [
  PortalFeedbackErrorCode.NotFound,
  PortalFeedbackErrorCode.Locked,
  PortalFeedbackErrorCode.Validation,
  PortalFeedbackErrorCode.ItemsRequired,
  PortalFeedbackErrorCode.ItemTextRequired,
  PortalFeedbackErrorCode.ItemsPresent,
  PortalFeedbackErrorCode.NotLatest,
  PortalFeedbackErrorCode.ConfirmationRequired,
  PortalFeedbackErrorCode.AttachmentLimit,
  PortalFeedbackErrorCode.NotAttachable,
  PortalFeedbackErrorCode.ClarificationNotOpen,
  PortalFeedbackErrorCode.CommandIdReused,
  PortalFeedbackErrorCode.Unavailable,
] as const;
