import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";

export interface LeadSocialProfileDto {
  id: string;
  platform: LeadSocialPlatform;
  profileUrl: string;
  normalizedUrl: string;
}
