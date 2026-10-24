import type { TrustPoint } from "@/common/contracts/marketing";
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingAiHeroContent = {
  tag: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  trustChips: TrustPoint[];
  visualAriaLabel: string;
};

const CONTENT: Record<Locale, LandingAiHeroContent> = {
  de: de as LandingAiHeroContent,
  en: en as LandingAiHeroContent,
};

export function getLinkedInPostHeroContent(
  locale: Locale,
): LandingAiHeroContent {
  return CONTENT[locale];
}
