import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type KlarkompassMetaContent = {
  description: string;
  imageAlt: string;
  imageHeight: number;
  imageUrl: string;
  imageWidth: number;
  openGraphLocale: string;
  title: string;
};

const KLARKOMPASS_META_CONTENT: Record<Locale, KlarkompassMetaContent> = {
  de,
  en,
};

export function getKlarkompassMetaContent(
  locale: Locale,
): KlarkompassMetaContent {
  return KLARKOMPASS_META_CONTENT[locale];
}
