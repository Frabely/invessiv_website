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
      "#proof": "Ergebnisse",
      "#services": "Leistungen & Preise",
      "#process": "Prozess",
      "#faq": "FAQ",
      "#contact": "Kontakt",
    },
    localeMenuLabel: "Sprache öffnen",
    localeSwitchLabel: "Sprache wählen",
    mobileMenuLabel: "Menü",
    navAriaLabel: "Hauptnavigation",
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
      "#proof": "Proof",
      "#services": "Services & Pricing",
      "#process": "Process",
      "#faq": "FAQ",
      "#contact": "Contact",
    },
    localeMenuLabel: "Open language",
    localeSwitchLabel: "Choose language",
    mobileMenuLabel: "Menu",
    navAriaLabel: "Primary navigation",
    themeToggleLabel: {
      dark: "Light",
      light: "Dark",
    },
  },
};

export function getSiteHeaderUiContent(locale: Locale): SiteHeaderUiContent {
  return SITE_HEADER_UI_CONTENT[locale];
}
