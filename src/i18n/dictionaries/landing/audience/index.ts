import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export const AUDIENCE_ICON_KEYS = [
  "hammer",
  "coach",
  "consultant",
  "camera",
  "pin",
  "building",
  "spark",
] as const;

export type AudienceIconKey = (typeof AUDIENCE_ICON_KEYS)[number];

export type LandingAudienceItem = {
  iconKey: AudienceIconKey;
  label: string;
  scenario: string;
};

export type LandingAudienceContent = {
  body: string;
  eyebrow: string;
  items: LandingAudienceItem[];
  title: string;
};

const LANDING_AUDIENCE_CONTENT: Record<Locale, LandingAudienceContent> = {
  de: de as LandingAudienceContent,
  en: en as LandingAudienceContent,
};

export function getLandingAudienceContent(
  locale: Locale,
): LandingAudienceContent {
  return LANDING_AUDIENCE_CONTENT[locale];
}
