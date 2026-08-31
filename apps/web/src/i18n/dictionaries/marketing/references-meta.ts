import type { Locale } from "@/config/i18n";
import de from "./references-meta.de.json";
import en from "./references-meta.en.json";

export type ReferencesMetaContent = {
  description: string;
  imageAccentText: string;
  imageAlt: string;
  imageHeight: number;
  imageKicker: string;
  imageSupportingText: string;
  imageTitle: string;
  imageUrl: string;
  imageWidth: number;
  title: string;
};

const REFERENCES_META_CONTENT: Record<Locale, ReferencesMetaContent> = {
  de: de as ReferencesMetaContent,
  en: en as ReferencesMetaContent,
};

export function getReferencesMetaContent(
  locale: Locale,
): ReferencesMetaContent {
  return REFERENCES_META_CONTENT[locale];
}
