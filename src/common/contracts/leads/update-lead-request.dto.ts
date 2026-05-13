import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export type UpdateLeadRequestDto = {
  displayName?: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  category_id?: string | null;
  score?: number | null;
  owner?: string | null;
  notes?: string | null;
  improvements?: string[];
  social_profiles?: Array<{
    platform: LeadSocialPlatform;
    profile_url: string;
  }>;
  lead_status?: ContactLeadStatus;
};
