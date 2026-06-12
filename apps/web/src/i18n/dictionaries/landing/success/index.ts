import type { Locale } from "@/config/i18n";
import type { SuccessPageContent } from "@/i18n/dictionaries/shared/success-page";
import de from "./de.json";
import en from "./en.json";

export type LandingSuccessMeta = {
  description: string;
  title: string;
};

export type LandingSuccessContent = {
  meta: LandingSuccessMeta;
  page: SuccessPageContent;
};

const LANDING_SUCCESS_CONTENT: Record<Locale, LandingSuccessContent> = {
  de: de as LandingSuccessContent,
  en: en as LandingSuccessContent,
};

export function getLandingSuccessContent(
  locale: Locale,
): LandingSuccessContent {
  return LANDING_SUCCESS_CONTENT[locale];
}
