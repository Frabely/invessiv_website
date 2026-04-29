import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingTrustContent = {
  body: string;
  eyebrow: string;
  items: string[];
  itemsLabel: string;
  reassurance: string;
  title: string;
};

const LANDING_TRUST_CONTENT: Record<Locale, LandingTrustContent> = {
  de,
  en,
};

export function getLandingTrustContent(locale: Locale): LandingTrustContent {
  return LANDING_TRUST_CONTENT[locale];
}
