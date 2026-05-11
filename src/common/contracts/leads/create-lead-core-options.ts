import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadSource } from "@/common/constants/leads/sources/lead-sources";

export interface CreateLeadCoreOptions {
  source: LeadSource;
  activityType: LeadActivityType;
  activityMetadata?: Record<string, string | number>;
  externalGuid?: string;
  statusOverride?: ContactLeadStatus;
  ownerOverride?: string;
}
