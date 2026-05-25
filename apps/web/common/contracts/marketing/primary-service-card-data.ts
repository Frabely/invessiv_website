import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";

import type { PrimaryServiceKey } from "./primary-service-key";

export type PrimaryServiceCardData = Extract<
  ServiceCardCopy,
  { key: PrimaryServiceKey }
>;
