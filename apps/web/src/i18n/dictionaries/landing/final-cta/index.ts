import type { Locale } from "@/config/i18n";
import type {
  FinalCtaContent,
  FinalCtaFormCopy,
} from "@/i18n/dictionaries/shared/final-cta";
import de from "./de.json";
import en from "./en.json";

export type LandingFinalCtaFormCopy = FinalCtaFormCopy & {
  projectScopeLabel: string;
};
export type LandingFinalCtaContent = FinalCtaContent & {
  form: LandingFinalCtaFormCopy;
};

const LANDING_FINAL_CTA_CONTENT: Record<Locale, LandingFinalCtaContent> = {
  de: de as LandingFinalCtaContent,
  en: en as LandingFinalCtaContent,
};

export function getLandingFinalCtaContent(
  locale: Locale,
): LandingFinalCtaContent {
  return LANDING_FINAL_CTA_CONTENT[locale];
}
