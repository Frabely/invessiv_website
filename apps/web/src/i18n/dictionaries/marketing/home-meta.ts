import type { Locale } from "@/config/i18n";
import de from "./home-meta.de.json";
import en from "./home-meta.en.json";

export type HomeMetaContent = {
  description: string;
  imageAccentText: string;
  imageAlt: string;
  imageContactLabel: string;
  imageHeight: number;
  imageKicker: string;
  imageSupportingText: string;
  imageTitle: string;
  imageUrl: string;
  imageWidth: number;
  title: string;
};

const HOME_META_CONTENT: Record<Locale, HomeMetaContent> = {
  de: de as HomeMetaContent,
  en: en as HomeMetaContent,
};

export function getHomeMetaContent(locale: Locale): HomeMetaContent {
  return HOME_META_CONTENT[locale];
}
