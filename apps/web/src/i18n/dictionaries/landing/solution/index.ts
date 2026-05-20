import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingSolutionGraphicContent = {
  browserLabel: string;
  buttonLabel: string;
  formButton: string;
  formFields: string[];
  formLabel: string;
  formSecurity: string;
  formTitle: string;
  heroTitle: string;
  rating: string;
  trustLabel: string;
  valueLabel: string;
  valueTiles: string[];
};

export type LandingSolutionContent = {
  body: string;
  eyebrow: string;
  graphic: LandingSolutionGraphicContent;
  title: string;
};

const LANDING_SOLUTION_CONTENT: Record<Locale, LandingSolutionContent> = {
  de: de as LandingSolutionContent,
  en: en as LandingSolutionContent,
};

export function getLandingSolutionContent(
  locale: Locale,
): LandingSolutionContent {
  return LANDING_SOLUTION_CONTENT[locale];
}
