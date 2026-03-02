import type { Locale } from "@/config/i18n";

export type SiteHeaderUiContent = {
  ctaLabel: string;
  labelsByHref: Record<string, string>;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  mobileMenuLabel: string;
  themeToggleLabel: {
    dark: string;
    light: string;
  };
};

const SITE_HEADER_UI_CONTENT: Record<Locale, SiteHeaderUiContent> = {
  de: {
    ctaLabel: "Projekt anfragen",
    labelsByHref: {
      "#proof": "Ergebnisse",
      "#services": "Leistungen & Preise",
      "#process": "Prozess",
      "#contact": "Kontakt",
    },
    localeMenuLabel: "Sprache öffnen",
    localeSwitchLabel: "Sprache wählen",
    mobileMenuLabel: "Menue",
    themeToggleLabel: {
      dark: "Light",
      light: "Dark",
    },
  },
  en: {
    ctaLabel: "Request project",
    labelsByHref: {
      "#proof": "Proof",
      "#services": "Leistungen & Preise",
      "#process": "Process",
      "#contact": "Contact",
    },
    localeMenuLabel: "Open language",
    localeSwitchLabel: "Choose language",
    mobileMenuLabel: "Menu",
    themeToggleLabel: {
      dark: "Light",
      light: "Dark",
    },
  },
};

export function getSiteHeaderUiContent(locale: Locale): SiteHeaderUiContent {
  return SITE_HEADER_UI_CONTENT[locale];
}
