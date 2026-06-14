import { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export const LeadProfileType = {
  Website: "website",
  Phone: "phone",
  Linkedin: LeadSocialPlatform.Linkedin,
  Instagram: LeadSocialPlatform.Instagram,
  Youtube: LeadSocialPlatform.Youtube,
} as const;

export type LeadProfileType =
  (typeof LeadProfileType)[keyof typeof LeadProfileType];

export const LEAD_PROFILE_TYPE_VALUES = [
  LeadProfileType.Website,
  LeadProfileType.Phone,
  LeadProfileType.Linkedin,
  LeadProfileType.Instagram,
  LeadProfileType.Youtube,
] as const;
