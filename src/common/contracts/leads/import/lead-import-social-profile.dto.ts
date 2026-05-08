import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";

export interface LeadImportSocialProfileDto {
  platform: LeadSocialPlatform;
  profileUrl: string;
}
