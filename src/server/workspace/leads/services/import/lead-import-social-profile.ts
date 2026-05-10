import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";

export interface ValidatedLeadImportSocialProfile {
  platform: LeadSocialPlatform;
  profile_url: string;
  normalized_url: string;
}
