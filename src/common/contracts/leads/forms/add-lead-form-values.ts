import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";

export type AddLeadFormValues = {
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
  improvements: Array<{ value: string }>;
  social_profiles: Array<{
    platform: LeadSocialPlatform;
    profile_url: string;
  }>;
};
