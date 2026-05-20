export const LeadSocialPlatform = {
  Linkedin: "linkedin",
  Instagram: "instagram",
  Youtube: "youtube",
} as const;

export type LeadSocialPlatform =
  (typeof LeadSocialPlatform)[keyof typeof LeadSocialPlatform];

export const LEAD_SOCIAL_PLATFORMS_VALUES = [
  LeadSocialPlatform.Linkedin,
  LeadSocialPlatform.Instagram,
  LeadSocialPlatform.Youtube,
] as const;
