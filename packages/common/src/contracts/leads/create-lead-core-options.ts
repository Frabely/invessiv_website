import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { LegacyLeadActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";

export interface CreateLeadCoreOptions {
  source: LeadSource;
  activityType: LegacyLeadActivityType;
  activityMetadata?: Record<string, string | number>;
  externalGuid?: string;
  statusOverride?: ContactLeadStatus;
  ownerOverride?: string;
}
