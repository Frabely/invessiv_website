import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingAiHeroContent = {
  tag: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  trustChips: string[];
  visualAriaLabel: string;
};

const CONTENT: Record<Locale, LandingAiHeroContent> = { de, en };

export function getAiWorkflowsHeroContent(
  locale: Locale,
): LandingAiHeroContent {
  return CONTENT[locale];
}
