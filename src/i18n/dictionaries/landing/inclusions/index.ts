import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingInclusionsItem = {
  detail?: string;
  headline: string;
};

export type LandingInclusionsContent = {
  body: string;
  eyebrow: string;
  items: LandingInclusionsItem[];
  itemsLabel: string;
  reassurance: string;
  title: string;
};

const LANDING_INCLUSIONS_CONTENT: Record<Locale, LandingInclusionsContent> = {
  de: de as LandingInclusionsContent,
  en: en as LandingInclusionsContent,
};

export function getLandingInclusionsContent(
  locale: Locale,
): LandingInclusionsContent {
  return LANDING_INCLUSIONS_CONTENT[locale];
}
