import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/lead-import-social-profile";

export interface ValidatedLeadImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  owner?: string;
  notes?: string;
  external_guid?: string;
  website_url?: string;
  category_slug?: string;
  category_id?: string;
  score?: number;
  status?: ContactLeadStatus;
  improvements: string[];
  social_profiles: ValidatedLeadImportSocialProfile[];
}
