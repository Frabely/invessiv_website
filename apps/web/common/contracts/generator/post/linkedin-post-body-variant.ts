export const LinkedInPostBodyVariant = {
  Insight: "insight",
  Bullets: "bullets",
} as const;

export type LinkedInPostBodyVariant =
  (typeof LinkedInPostBodyVariant)[keyof typeof LinkedInPostBodyVariant];

export const LINKEDIN_POST_BODY_VARIANT_VALUES = [
  LinkedInPostBodyVariant.Insight,
  LinkedInPostBodyVariant.Bullets,
] as const;
