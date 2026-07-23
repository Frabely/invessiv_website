import {
  CONTACT_LEAD_STATUS_ALL,
  ContactLeadStatus,
  type ContactLeadStatus as ContactLeadStatusValue,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  LeadBadgeTone,
  type LeadBadgeTone as LeadBadgeToneValue,
} from "@invessiv/common/constants/leads/badges/lead-badge-tones";

type LeadStatusBadgeStatus =
  | ContactLeadStatusValue
  | typeof CONTACT_LEAD_STATUS_ALL;

export const LEAD_STATUS_BADGE_TONES = {
  [CONTACT_LEAD_STATUS_ALL]: LeadBadgeTone.Neutral,
  [ContactLeadStatus.New]: LeadBadgeTone.Info,
  [ContactLeadStatus.PendingReview]: LeadBadgeTone.Warning,
  [ContactLeadStatus.Contacted]: LeadBadgeTone.Primary,
  [ContactLeadStatus.ConnectionRequested]: LeadBadgeTone.Magenta,
  [ContactLeadStatus.Connected]: LeadBadgeTone.Teal,
  [ContactLeadStatus.FollowUp]: LeadBadgeTone.Lime,
  [ContactLeadStatus.NotReached]: LeadBadgeTone.Coral,
  [ContactLeadStatus.Reminder]: LeadBadgeTone.Fuchsia,
  [ContactLeadStatus.Responded]: LeadBadgeTone.Pink,
  [ContactLeadStatus.SettingCall]: LeadBadgeTone.Indigo,
  [ContactLeadStatus.ClosingCall]: LeadBadgeTone.Teal,
  [ContactLeadStatus.Qualified]: LeadBadgeTone.Orange,
  [ContactLeadStatus.Proposal]: LeadBadgeTone.Purple,
  [ContactLeadStatus.OnHold]: LeadBadgeTone.Neutral,
  [ContactLeadStatus.Won]: LeadBadgeTone.Success,
  [ContactLeadStatus.Lost]: LeadBadgeTone.Danger,
  [ContactLeadStatus.Archived]: LeadBadgeTone.Neutral,
} as const satisfies Record<LeadStatusBadgeStatus, LeadBadgeToneValue>;
