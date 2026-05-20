import type { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export interface LeadImportSocialProfileDto {
  platform: LeadSocialPlatform;
  profileUrl: string;
}
