import type { Locale } from "@/config/i18n";
import type { SuccessPageContent } from "@/i18n/dictionaries/shared/success-page";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostSuccessMeta = {
  description: string;
  title: string;
};

export type LinkedInPostSuccessContent = {
  meta: LinkedInPostSuccessMeta;
  page: SuccessPageContent;
};

const LINKEDIN_POST_SUCCESS_CONTENT: Record<
  Locale,
  LinkedInPostSuccessContent
> = {
  de: de as LinkedInPostSuccessContent,
  en: en as LinkedInPostSuccessContent,
};

export function getLinkedInPostSuccessContent(
  locale: Locale,
): LinkedInPostSuccessContent {
  return LINKEDIN_POST_SUCCESS_CONTENT[locale];
}
