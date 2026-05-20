import type { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export interface LeadSocialProfileDto {
  id: string;
  platform: LeadSocialPlatform;
  profileUrl: string;
  normalizedUrl: string;
}
