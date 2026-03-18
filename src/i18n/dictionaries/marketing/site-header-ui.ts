import type { Locale } from "@/config/i18n";

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
  de: {
    actionsAriaLabel: "Sprache und primäre Aktion",
    brandLogoAlt: "Invessiv Logo",
    ctaLabel: "Projekt anfragen",
    labelsByHref: {
      "#included": "Was du bekommst",
      "#services": "Angebote & Preise",
      "#process": "Prozess",
      "#faq": "Q&A",
      "#contact": "Kontakt",
    },
    localeMenuLabel: "Sprache öffnen",
    localeSwitchLabel: "Sprache wählen",
    mobileMenuLabel: "Menü",
    navAriaLabel: "Hauptnavigation",
    skipLinkLabel: "Direkt zum Hauptinhalt springen",
    themeToggleLabel: {
      dark: "Light",
      light: "Dark",
    },
  },
  en: {
    actionsAriaLabel: "Language and primary action",
    brandLogoAlt: "Invessiv logo",
    ctaLabel: "Request project",
    labelsByHref: {
      "#included": "What you get",
      "#services": "Offers & pricing",
      "#process": "Process",
      "#faq": "Q&A",
      "#contact": "Contact",
    },
    localeMenuLabel: "Open language",
    localeSwitchLabel: "Choose language",
    mobileMenuLabel: "Menu",
    navAriaLabel: "Primary navigation",
    skipLinkLabel: "Skip to main content",
    themeToggleLabel: {
      dark: "Light",
      light: "Dark",
    },
  },
};

export function getSiteHeaderUiContent(locale: Locale): SiteHeaderUiContent {
  return SITE_HEADER_UI_CONTENT[locale];
}
