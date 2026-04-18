export const CONTACT_OFFER_KEY = {
  Landing: "landing",
  Maintenance: "maintenance",
  Process: "process",
  Upgrade: "upgrade",
  Web: "web",
} as const;

export const CONTACT_OFFER_KEYS = [
  CONTACT_OFFER_KEY.Landing,
  CONTACT_OFFER_KEY.Maintenance,
  CONTACT_OFFER_KEY.Process,
  CONTACT_OFFER_KEY.Upgrade,
  CONTACT_OFFER_KEY.Web,
] as const;

export type ContactOfferKey = (typeof CONTACT_OFFER_KEYS)[number];
