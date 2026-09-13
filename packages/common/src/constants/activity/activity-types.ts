export const ActivityType = {
  Note: "note",
  StatusChange: "status_change",
  InboundSubmission: "inbound_submission",
  Import: "import",
  BulkEdit: "bulk_edit",
  MessageDrafted: "message_drafted",
  Created: "created",
  FieldChange: "field_change",
  ConvertedFromLead: "converted_from_lead",
  CredentialRevealed: "credential_revealed",
  FileUploaded: "file_uploaded",
  SubmissionReceived: "submission_received",
  PhaseChange: "phase_change",
  RenewalRenewed: "renewal_renewed",
  MailSent: "mail_sent",
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const LEGACY_LEAD_ACTIVITY_TYPE_VALUES = [
  ActivityType.Note,
  ActivityType.StatusChange,
  ActivityType.InboundSubmission,
  ActivityType.Import,
  ActivityType.BulkEdit,
  ActivityType.MessageDrafted,
] as const;

export type LegacyLeadActivityType =
  (typeof LEGACY_LEAD_ACTIVITY_TYPE_VALUES)[number];

export const ACTIVITY_TYPE_VALUES = [
  ...LEGACY_LEAD_ACTIVITY_TYPE_VALUES,
  ActivityType.Created,
  ActivityType.FieldChange,
  ActivityType.ConvertedFromLead,
  ActivityType.CredentialRevealed,
  ActivityType.FileUploaded,
  ActivityType.SubmissionReceived,
  ActivityType.PhaseChange,
  ActivityType.RenewalRenewed,
  ActivityType.MailSent,
] as const;
