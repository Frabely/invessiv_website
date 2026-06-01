import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostHeaderContent = {
  actionsAriaLabel: string;
  brandLabel: string;
  brandLogoAlt: string;
  ctaLabel: string;
  labelsByHref: Record<string, string>;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  mobileMenuLabel: string;
  navAriaLabel: string;
};

const LINKEDIN_POST_HEADER_CONTENT: Record<Locale, LinkedInPostHeaderContent> =
  {
    de,
    en,
  };

export function getLinkedInPostHeaderContent(
  locale: Locale,
): LinkedInPostHeaderContent {
  return LINKEDIN_POST_HEADER_CONTENT[locale];
}
