export const HERO_TRUST_ICON_KEY = {
  DirectContact: "directContact",
  NoAgencyLoop: "noAgencyLoop",
  SoftwareBackground: "softwareBackground",
} as const;

export type HeroTrustIconKey =
  (typeof HERO_TRUST_ICON_KEY)[keyof typeof HERO_TRUST_ICON_KEY];
