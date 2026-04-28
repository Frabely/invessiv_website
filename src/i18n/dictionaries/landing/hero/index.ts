import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingHeroQuickEntry = {
  placeholder: string;
  submitAriaLabel: string;
};

export type LandingHeroContent = {
  description: string;
  primaryCta: string;
  quickEntry: LandingHeroQuickEntry;
  secondaryCta: string;
  tag: string;
  title: string;
  trustLine: string;
  visualAriaLabel: string;
};

const LANDING_HERO_CONTENT: Record<Locale, LandingHeroContent> = {
  de: de as LandingHeroContent,
  en: en as LandingHeroContent,
};

export function getLandingHeroContent(locale: Locale): LandingHeroContent {
  return LANDING_HERO_CONTENT[locale];
}
