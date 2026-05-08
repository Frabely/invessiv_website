import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";

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
  socialProfiles?: Array<{
    platform: LeadSocialPlatform;
    profileUrl: string;
  }>;
}
