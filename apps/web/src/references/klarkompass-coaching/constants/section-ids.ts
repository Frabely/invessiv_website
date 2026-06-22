export const KLARKOMPASS_SECTION_ID = {
  Hero: "kk-hero",
  Problem: "kk-problem",
  Results: "kk-results",
  Method: "kk-method",
  Offer: "kk-offer",
  About: "kk-about",
  Process: "kk-process",
  Trust: "kk-trust",
  Faq: "kk-faq",
  FinalCta: "kk-contact",
} as const;

export type KlarkompassSectionId =
  (typeof KLARKOMPASS_SECTION_ID)[keyof typeof KLARKOMPASS_SECTION_ID];

export const KLARKOMPASS_NAV_SECTION_IDS = [
  KLARKOMPASS_SECTION_ID.Problem,
  KLARKOMPASS_SECTION_ID.Method,
  KLARKOMPASS_SECTION_ID.Offer,
  KLARKOMPASS_SECTION_ID.About,
  KLARKOMPASS_SECTION_ID.Faq,
] as const;
