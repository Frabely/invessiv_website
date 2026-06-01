import type { Locale } from "@/config/i18n";
import type { FooterColumnCopy } from "@/i18n/dictionaries/marketing/home";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostFooterContent = {
  description: string;
  navColumn: FooterColumnCopy;
};

const LINKEDIN_POST_FOOTER_CONTENT: Record<Locale, LinkedInPostFooterContent> =
  {
    de: de as LinkedInPostFooterContent,
    en: en as LinkedInPostFooterContent,
  };

export function getLinkedInPostFooterContent(
  locale: Locale,
): LinkedInPostFooterContent {
  return LINKEDIN_POST_FOOTER_CONTENT[locale];
}
