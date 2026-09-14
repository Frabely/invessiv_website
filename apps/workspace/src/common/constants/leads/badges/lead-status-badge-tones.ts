import {
  CONTACT_LEAD_STATUS_ALL,
  ContactLeadStatus,
  type ContactLeadStatus as ContactLeadStatusValue,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

type LeadStatusBadgeStatus =
  ContactLeadStatusValue | typeof CONTACT_LEAD_STATUS_ALL;

export const LEAD_STATUS_BADGE_TONES = {
  [CONTACT_LEAD_STATUS_ALL]: BadgeTone.Neutral,
  [ContactLeadStatus.New]: BadgeTone.Info,
  [ContactLeadStatus.PendingReview]: BadgeTone.Warning,
  [ContactLeadStatus.Contacted]: BadgeTone.Primary,
  [ContactLeadStatus.ConnectionRequested]: BadgeTone.Magenta,
  [ContactLeadStatus.Connected]: BadgeTone.Teal,
  [ContactLeadStatus.FollowUp]: BadgeTone.Lime,
  [ContactLeadStatus.NotReached]: BadgeTone.Coral,
  [ContactLeadStatus.Reminder]: BadgeTone.Fuchsia,
  [ContactLeadStatus.Responded]: BadgeTone.Pink,
  [ContactLeadStatus.SettingCall]: BadgeTone.Indigo,
  [ContactLeadStatus.ClosingCall]: BadgeTone.Teal,
  [ContactLeadStatus.Qualified]: BadgeTone.Orange,
  [ContactLeadStatus.Proposal]: BadgeTone.Purple,
  [ContactLeadStatus.OnHold]: BadgeTone.Neutral,
  [ContactLeadStatus.Won]: BadgeTone.Success,
  [ContactLeadStatus.Lost]: BadgeTone.Danger,
  [ContactLeadStatus.Archived]: BadgeTone.Neutral,
} as const satisfies Record<LeadStatusBadgeStatus, BadgeToneValue>;
