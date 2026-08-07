import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

type LandingHeroContent = {
  description: string;
  primaryCta: string;
  preview: LandingCoachingPreviewContent;
  secondaryCta: string;
  tag: string;
  title: string;
  trustLine: string;
};

const LANDING_HERO_CONTENT: Record<Locale, LandingHeroContent> = {
  de,
  en,
};

export function getLandingHeroContent(locale: Locale): LandingHeroContent {
  return LANDING_HERO_CONTENT[locale];
}
