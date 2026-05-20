import type { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export type LeadSocialProfileRow = {
  id: string;
  platform: LeadSocialPlatform;
  profile_url: string;
  normalized_url: string;
};
