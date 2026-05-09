import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";

export type UpdateLeadRequestDto = {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  category_id?: string;
  score?: number;
  owner?: string;
  notes?: string;
  improvements?: string[];
  social_profiles?: Array<{
    platform: LeadSocialPlatform;
    profile_url: string;
  }>;
  lead_status?: ContactLeadStatus;
};
