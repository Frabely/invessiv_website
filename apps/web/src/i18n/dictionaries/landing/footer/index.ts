import type { Locale } from "@/config/i18n";
import type { FooterColumnCopy } from "@/i18n/dictionaries/marketing/home";
import de from "./de.json";
import en from "./en.json";

export type LandingFooterContent = {
  description: string;
  navColumn: FooterColumnCopy;
};

const LANDING_FOOTER_CONTENT: Record<Locale, LandingFooterContent> = {
  de: de as LandingFooterContent,
  en: en as LandingFooterContent,
};

export function getLandingFooterContent(locale: Locale): LandingFooterContent {
  return LANDING_FOOTER_CONTENT[locale];
}
