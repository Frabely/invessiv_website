import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";
import type { LeadCategoryDto } from "./lead-category.dto";
import type { LeadSocialProfileDto } from "./lead-social-profile.dto";

export interface LeadSummaryDto {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  score: number | null;
  source: LeadSource;
  leadStatus: ContactLeadStatus;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  category: LeadCategoryDto | null;
  socialProfiles: LeadSocialProfileDto[];
}
