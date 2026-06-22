import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingReferenceContent = {
  eyebrow: string;
  title: string;
  description: string;
  conceptBadge: string;
  browserLabel: string;
  previewAlt: string;
  highlights: string[];
  linkLabel: string;
};

const LANDING_REFERENCE_CONTENT: Record<Locale, LandingReferenceContent> = {
  de: de as LandingReferenceContent,
  en: en as LandingReferenceContent,
};

export function getLandingReferenceContent(
  locale: Locale,
): LandingReferenceContent {
  return LANDING_REFERENCE_CONTENT[locale];
}
