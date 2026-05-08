import type { LeadImportSocialProfileDto } from "./lead-import-social-profile.dto";

export interface LeadImportRowDto {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  owner?: string;
  notes?: string;
  externalGuid?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  categoryId?: string;
  score?: number;
  status?: string;
  improvements?: string[];
  socialProfiles?: LeadImportSocialProfileDto[];
}
