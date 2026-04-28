import type { Locale } from "@/config/i18n";
import type { LandingSectionCtaContent } from "@/i18n/dictionaries/landing/types";
import de from "./de.json";
import en from "./en.json";

export type LandingFaqLink = {
  href: string;
  label: string;
};

export type LandingFaqItem = {
  answer: string;
  link?: LandingFaqLink;
  question: string;
};

export type LandingFaqContent = {
  cta?: LandingSectionCtaContent;
  eyebrow: string;
  items: LandingFaqItem[];
  title: string;
};

const LANDING_FAQ_CONTENT: Record<Locale, LandingFaqContent> = {
  de: de as LandingFaqContent,
  en: en as LandingFaqContent,
};

export function getLandingFaqContent(locale: Locale): LandingFaqContent {
  return LANDING_FAQ_CONTENT[locale];
}
