import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export const PROCESS_ICON_KEYS = [
  "target",
  "structure",
  "build",
  "launch",
] as const;

export type ProcessIconKey = (typeof PROCESS_ICON_KEYS)[number];

export type LandingProcessStep = {
  description: string;
  iconKey: ProcessIconKey;
  numeral: string;
  title: string;
};

export type LandingProcessContent = {
  eyebrow: string;
  steps: LandingProcessStep[];
  title: string;
};

const LANDING_PROCESS_CONTENT: Record<Locale, LandingProcessContent> = {
  de: de as LandingProcessContent,
  en: en as LandingProcessContent,
};

export function getLandingProcessContent(
  locale: Locale,
): LandingProcessContent {
  return LANDING_PROCESS_CONTENT[locale];
}
