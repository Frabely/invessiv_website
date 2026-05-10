import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export interface LeadSocialProfileDto {
  id: string;
  platform: LeadSocialPlatform;
  profileUrl: string;
  normalizedUrl: string;
}
