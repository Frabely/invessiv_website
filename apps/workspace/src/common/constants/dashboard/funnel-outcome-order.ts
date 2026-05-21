import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export const FUNNEL_OUTCOME_ORDER = [
  ContactLeadStatus.OnHold,
  ContactLeadStatus.Lost,
  ContactLeadStatus.Archived,
] as const;

export type FunnelOutcomeStatus = (typeof FUNNEL_OUTCOME_ORDER)[number];
