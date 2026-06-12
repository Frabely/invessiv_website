import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingPricingCard = {
  planLabel: string;
  planTitle: string;
  planDescription: string;
  itemsLabel: string;
  items: string[];
  durationLabel: string;
  durationValue: string;
  priceLabel: string;
  priceValue: string;
};

export type LandingPricingContent = {
  card: LandingPricingCard;
  ctaLabel: string;
  eyebrow: string;
  hint: string;
  title: string;
};

const LANDING_PRICING_CONTENT: Record<Locale, LandingPricingContent> = {
  de: de as LandingPricingContent,
  en: en as LandingPricingContent,
};

export function getLandingPricingContent(
  locale: Locale,
): LandingPricingContent {
  return LANDING_PRICING_CONTENT[locale];
}
