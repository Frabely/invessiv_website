import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingDoneForYouContent = {
  body: string;
  eyebrow: string;
  items: string[];
  itemsLabel: string;
  reassurance: string;
  title: string;
};

const LANDING_DONE_FOR_YOU_CONTENT: Record<Locale, LandingDoneForYouContent> = {
  de,
  en,
};

export function getLandingDoneForYouContent(
  locale: Locale,
): LandingDoneForYouContent {
  return LANDING_DONE_FOR_YOU_CONTENT[locale];
}
