import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingHeaderContent = {
  actionsAriaLabel: string;
  brandLogoAlt: string;
  ctaLabel: string;
  labelsByHref: Record<string, string>;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  mobileMenuLabel: string;
  navAriaLabel: string;
};

const LANDING_HEADER_CONTENT: Record<Locale, LandingHeaderContent> = {
  de,
  en,
};

export function getLandingHeaderContent(locale: Locale): LandingHeaderContent {
  return LANDING_HEADER_CONTENT[locale];
}
