import type { ContactOfferKey } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";

export type PrimaryServiceKey = Exclude<
  ContactOfferKey,
  typeof CONTACT_OFFER_KEY.Maintenance
>;
