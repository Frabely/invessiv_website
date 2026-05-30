export const LinkedInPostTone = {
  Factual: "sachlich",
  Personal: "persönlich",
  Provocative: "provokativ",
} as const;

export type LinkedInPostTone =
  (typeof LinkedInPostTone)[keyof typeof LinkedInPostTone];

export const LINKEDIN_POST_TONE_VALUES = [
  LinkedInPostTone.Factual,
  LinkedInPostTone.Personal,
  LinkedInPostTone.Provocative,
] as const;
