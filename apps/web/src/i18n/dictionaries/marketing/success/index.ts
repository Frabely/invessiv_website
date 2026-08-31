import type { Locale } from "@/config/i18n";
import type { SuccessPageContent } from "@/i18n/dictionaries/shared/success-page";
import de from "./de.json";
import en from "./en.json";

type SuccessMeta = {
  description: string;
  title: string;
};

type SuccessContent = {
  meta: SuccessMeta;
  page: SuccessPageContent;
};

const SUCCESS_CONTENT: Record<Locale, SuccessContent> = {
  de: de as SuccessContent,
  en: en as SuccessContent,
};

export function getSuccessContent(locale: Locale): SuccessContent {
  return SUCCESS_CONTENT[locale];
}
