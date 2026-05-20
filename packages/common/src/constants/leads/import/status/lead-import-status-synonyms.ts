import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export const LEAD_IMPORT_STATUS_SYNONYMS: Record<string, ContactLeadStatus> = {
  "zu prüfen": ContactLeadStatus.PendingReview,
  "pending review": ContactLeadStatus.PendingReview,
  pending_review: ContactLeadStatus.PendingReview,
  neu: ContactLeadStatus.New,
  new: ContactLeadStatus.New,
  kontaktiert: ContactLeadStatus.Contacted,
  contacted: ContactLeadStatus.Contacted,
  qualifiziert: ContactLeadStatus.Qualified,
  qualified: ContactLeadStatus.Qualified,
  angebot: ContactLeadStatus.Proposal,
  proposal: ContactLeadStatus.Proposal,
  pausiert: ContactLeadStatus.OnHold,
  "on hold": ContactLeadStatus.OnHold,
  on_hold: ContactLeadStatus.OnHold,
  gewonnen: ContactLeadStatus.Won,
  won: ContactLeadStatus.Won,
  verloren: ContactLeadStatus.Lost,
  lost: ContactLeadStatus.Lost,
  archiviert: ContactLeadStatus.Archived,
  archived: ContactLeadStatus.Archived,
};
