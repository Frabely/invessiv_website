import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";

export type MaintenanceServiceCardData = Extract<
  ServiceCardCopy,
  { key: typeof CONTACT_OFFER_KEY.Maintenance }
>;
