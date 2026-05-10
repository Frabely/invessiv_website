import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export interface CreateLeadCoreSocialProfileInput {
  platform: LeadSocialPlatform;
  profile_url: string;
}

export interface CreateLeadCoreInput {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  website_url?: string;
  category_id?: string;
  score?: number;
  owner?: string;
  notes?: string;
  improvements?: string[];
  social_profiles?: CreateLeadCoreSocialProfileInput[];
}

export interface CreateLeadCoreOptions {
  source: LeadSource;
  activityType: LeadActivityType;
  activityMetadata?: Record<string, string | number>;
  externalGuid?: string;
  statusOverride?: ContactLeadStatus;
  ownerOverride?: string;
}
