import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export interface LeadImportSocialProfileDto {
  platform: LeadSocialPlatform;
  profileUrl: string;
}
