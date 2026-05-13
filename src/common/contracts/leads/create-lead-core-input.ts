import type { CreateLeadCoreSocialProfileInput } from "./create-lead-core-social-profile-input";

export interface CreateLeadCoreInput {
  displayName: string;
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
  social_profiles?: CreateLeadCoreSocialProfileInput[];
}
