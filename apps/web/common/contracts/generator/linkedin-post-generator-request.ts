import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { LinkedInPostTone } from "@invessiv/common/contracts/generator/linkedin-post-generator-tone";

export type LinkedInPostGeneratorRequestDto = {
  topic: string;
  expertise: string;
  tone: LinkedInPostTone;
  colorPairId: string;
  email: string;
  consent: boolean;
  company: string;
  locale: Locale;
};
