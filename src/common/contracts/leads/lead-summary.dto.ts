import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadSource } from "@/common/constants/leads/lead-sources";
import type { LeadCategoryDto } from "./lead-category.dto";

export interface LeadSummaryDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string;
  websiteUrl: string | null;
  score: number | null;
  source: LeadSource;
  leadStatus: ContactLeadStatus;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  category: LeadCategoryDto | null;
}
