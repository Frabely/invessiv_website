import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";

export type PrimaryServiceKey =
  | typeof CONTACT_OFFER_KEY.Landing
  | typeof CONTACT_OFFER_KEY.Upgrade
  | typeof CONTACT_OFFER_KEY.Web;
