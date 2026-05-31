import type { Locale } from "@/config/i18n";
import type { FinalCtaContent } from "@/i18n/dictionaries/shared/final-cta";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostFinalCtaContent = FinalCtaContent;

const LINKEDIN_POST_FINAL_CTA_CONTENT: Record<
  Locale,
  LinkedInPostFinalCtaContent
> = {
  de: de as LinkedInPostFinalCtaContent,
  en: en as LinkedInPostFinalCtaContent,
};

export function getLinkedInPostFinalCtaContent(
  locale: Locale,
): LinkedInPostFinalCtaContent {
  return LINKEDIN_POST_FINAL_CTA_CONTENT[locale];
}
