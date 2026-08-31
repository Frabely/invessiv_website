import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingMetaContent = {
  description: string;
  imageAlt: string;
  imageHeight: number;
  imageUrl: string;
  imageWidth: number;
  title: string;
};

const LANDING_META_CONTENT: Record<Locale, LandingMetaContent> = {
  de,
  en,
};

export function getLandingMetaContent(locale: Locale): LandingMetaContent {
  return LANDING_META_CONTENT[locale];
}
