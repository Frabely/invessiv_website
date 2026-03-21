import type { Locale } from "@/config/i18n";
import de from "./site-header-ui.de.json";
import en from "./site-header-ui.en.json";

export type SiteHeaderUiContent = {
  actionsAriaLabel: string;
  brandLogoAlt: string;
  ctaLabel: string;
  labelsByHref: Record<string, string>;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  mobileMenuLabel: string;
  navAriaLabel: string;
  skipLinkLabel: string;
  themeToggleLabel: {
    dark: string;
    light: string;
  };
};

const SITE_HEADER_UI_CONTENT: Record<Locale, SiteHeaderUiContent> = {
  de,
  en,
};

export function getSiteHeaderUiContent(locale: Locale): SiteHeaderUiContent {
  return SITE_HEADER_UI_CONTENT[locale];
}
