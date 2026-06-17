export const ContactLeadStatus = {
  New: "new",
  PendingReview: "pending_review",
  Contacted: "contacted",
  ConnectionRequested: "connection_requested",
  Connected: "connected",
  FollowUp: "follow_up",
  NotReached: "not_reached",
  Reminder: "reminder",
  Responded: "responded",
  Qualified: "qualified",
  Proposal: "proposal",
  OnHold: "on_hold",
  Won: "won",
  Lost: "lost",
  Archived: "archived",
} as const;

export type ContactLeadStatus =
  (typeof ContactLeadStatus)[keyof typeof ContactLeadStatus];

export const CONTACT_LEAD_STATUS_ALL = "all" as const;

export const CONTACT_LEAD_STATUS_VALUES = [
  ContactLeadStatus.New,
  ContactLeadStatus.PendingReview,
  ContactLeadStatus.Contacted,
  ContactLeadStatus.ConnectionRequested,
  ContactLeadStatus.Connected,
  ContactLeadStatus.FollowUp,
  ContactLeadStatus.NotReached,
  ContactLeadStatus.Reminder,
  ContactLeadStatus.Responded,
  ContactLeadStatus.Qualified,
  ContactLeadStatus.Proposal,
  ContactLeadStatus.OnHold,
  ContactLeadStatus.Won,
  ContactLeadStatus.Lost,
  ContactLeadStatus.Archived,
] as const;
