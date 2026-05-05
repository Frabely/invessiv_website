export const ContactLeadStatus = {
  New: "new",
  Contacted: "contacted",
  Qualified: "qualified",
  Proposal: "proposal",
  OnHold: "on_hold",
  Won: "won",
  Lost: "lost",
  Archived: "archived",
} as const;

export type ContactLeadStatus =
  (typeof ContactLeadStatus)[keyof typeof ContactLeadStatus];

export const CONTACT_LEAD_STATUS_VALUES = [
  ContactLeadStatus.New,
  ContactLeadStatus.Contacted,
  ContactLeadStatus.Qualified,
  ContactLeadStatus.Proposal,
  ContactLeadStatus.OnHold,
  ContactLeadStatus.Won,
  ContactLeadStatus.Lost,
  ContactLeadStatus.Archived,
] as const;
