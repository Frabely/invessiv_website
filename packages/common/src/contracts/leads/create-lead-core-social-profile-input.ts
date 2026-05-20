import type { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export interface CreateLeadCoreSocialProfileInput {
  platform: LeadSocialPlatform;
  profile_url: string;
}
