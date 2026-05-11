import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export interface CreateLeadCoreSocialProfileInput {
  platform: LeadSocialPlatform;
  profile_url: string;
}
