import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import type { LeadCategoryRow } from "./lead-category-row";

export type LeadDetailMainRow = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  score: number | null;
  source: LeadSource;
  lead_status: ContactLeadStatus;
  owner: string | null;
  notes: string | null;
  improvements: string[] | null;
  external_guid: string | null;
  created_at: Date;
  updated_at: Date;
} & LeadCategoryRow;
