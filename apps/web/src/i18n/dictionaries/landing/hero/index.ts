import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingHeroContent = {
  description: string;
  primaryCta: string;
  secondaryCta: string;
  tag: string;
  title: string;
  trustLine: string;
  visualAriaLabel: string;
};

const LANDING_HERO_CONTENT: Record<Locale, LandingHeroContent> = {
  de,
  en,
};

export function getLandingHeroContent(locale: Locale): LandingHeroContent {
  return LANDING_HERO_CONTENT[locale];
}
