import type { Locale } from "@/config/i18n";
import type { LandingSectionCtaContent } from "@/i18n/dictionaries/landing/types";
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
  "scales",
  "clipboard",
  "calculator",
] as const;

export type AudienceIconKey = (typeof AUDIENCE_ICON_KEYS)[number];

export type LandingAudienceDetail = {
  headline: string;
  outcome: string;
  problems: string[];
};

export type LandingAudienceItem = {
  detail: LandingAudienceDetail;
  iconKey: AudienceIconKey;
  label: string;
};

export type LandingAudienceContent = {
  body: string;
  bodyHighlight: string;
  closeLabel: string;
  cta?: LandingSectionCtaContent;
  eyebrow: string;
  items: LandingAudienceItem[];
  outcomeLabel: string;
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
