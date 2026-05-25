import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";

import type { PrimaryServiceKey } from "@/common/contracts";

export type PrimaryServiceCardData = ServiceCardCopy & {
  key: PrimaryServiceKey;
};
