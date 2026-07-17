import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export const LEAD_IMPORT_STATUS_SYNONYMS: Record<string, ContactLeadStatus> = {
  pending_review: ContactLeadStatus.PendingReview,
  new: ContactLeadStatus.New,
  contacted: ContactLeadStatus.Contacted,
  connection_requested: ContactLeadStatus.ConnectionRequested,
  connected: ContactLeadStatus.Connected,
  follow_up: ContactLeadStatus.FollowUp,
  not_reached: ContactLeadStatus.NotReached,
  reminder: ContactLeadStatus.Reminder,
  responded: ContactLeadStatus.Responded,
  setting_call: ContactLeadStatus.SettingCall,
  closing_call: ContactLeadStatus.ClosingCall,
  qualified: ContactLeadStatus.Qualified,
  proposal: ContactLeadStatus.Proposal,
  on_hold: ContactLeadStatus.OnHold,
  won: ContactLeadStatus.Won,
  lost: ContactLeadStatus.Lost,
  archived: ContactLeadStatus.Archived,
};
