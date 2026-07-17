import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export const MESSAGING_STAGE_ORDER = [
  ContactLeadStatus.Contacted,
  ContactLeadStatus.Responded,
  ContactLeadStatus.SettingCall,
  ContactLeadStatus.ClosingCall,
  ContactLeadStatus.Won,
] as const;

export type MessagingStage = (typeof MESSAGING_STAGE_ORDER)[number];
