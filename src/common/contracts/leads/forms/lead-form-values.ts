import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export type LeadFormValues = {
  displayName: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  website_url: string;
  category_id: string;
  score: string;
  owner: string;
  notes: string;
  lead_status: ContactLeadStatus;
  improvements: Array<{ value: string }>;
  social_profiles: Array<{
    platform: LeadSocialPlatform;
    profile_url: string;
  }>;
};
