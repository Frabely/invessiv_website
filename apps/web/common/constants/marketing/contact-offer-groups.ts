import type { ContactOfferKey } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";

export const CONTACT_OFFER_GROUP = {
  Process: "process",
  Support: "support",
  Web: "web",
} as const;

export type ContactOfferGroup =
  (typeof CONTACT_OFFER_GROUP)[keyof typeof CONTACT_OFFER_GROUP];

export const CONTACT_OFFER_GROUP_VALUES = [
  CONTACT_OFFER_GROUP.Web,
  CONTACT_OFFER_GROUP.Process,
  CONTACT_OFFER_GROUP.Support,
] as const;

export const CONTACT_OFFER_GROUP_BY_KEY = {
  [CONTACT_OFFER_KEY.Landing]: CONTACT_OFFER_GROUP.Web,
  [CONTACT_OFFER_KEY.Web]: CONTACT_OFFER_GROUP.Web,
  [CONTACT_OFFER_KEY.Upgrade]: CONTACT_OFFER_GROUP.Web,
  [CONTACT_OFFER_KEY.Process]: CONTACT_OFFER_GROUP.Process,
  [CONTACT_OFFER_KEY.Maintenance]: CONTACT_OFFER_GROUP.Support,
} as const satisfies Record<ContactOfferKey, ContactOfferGroup>;

export const CANONICAL_CONTACT_OFFER_KEY_BY_GROUP = {
  [CONTACT_OFFER_GROUP.Web]: CONTACT_OFFER_KEY.Landing,
  [CONTACT_OFFER_GROUP.Process]: CONTACT_OFFER_KEY.Process,
  [CONTACT_OFFER_GROUP.Support]: CONTACT_OFFER_KEY.Maintenance,
} as const satisfies Record<ContactOfferGroup, ContactOfferKey>;

export const getContactOfferGroup = (
  offerKey: ContactOfferKey,
): ContactOfferGroup => CONTACT_OFFER_GROUP_BY_KEY[offerKey];

export const getCanonicalContactOfferKey = (
  offerKey: ContactOfferKey,
): ContactOfferKey =>
  CANONICAL_CONTACT_OFFER_KEY_BY_GROUP[getContactOfferGroup(offerKey)];
