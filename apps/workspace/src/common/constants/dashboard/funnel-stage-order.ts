import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export const FUNNEL_STAGE_ORDER = [
  ContactLeadStatus.New,
  ContactLeadStatus.Contacted,
  ContactLeadStatus.Responded,
  ContactLeadStatus.Qualified,
  ContactLeadStatus.Proposal,
  ContactLeadStatus.Won,
] as const;

export type FunnelStage = (typeof FUNNEL_STAGE_ORDER)[number];
