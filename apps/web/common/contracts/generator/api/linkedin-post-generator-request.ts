import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { LinkedInPostTone } from "@/common/contracts";

export type LinkedInPostGeneratorRequestDto = {
  topic: string;
  expertise: string;
  tone: LinkedInPostTone;
  colorPairId: string;
  displayName: string;
  email: string;
  consent: boolean;
  company: string;
  locale: Locale;
};
