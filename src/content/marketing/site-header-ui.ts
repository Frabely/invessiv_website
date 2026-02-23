import type { Locale } from "@/config/i18n";

export type SiteHeaderUiContent = {
  ctaLabel: string;
  labelsByHref: Record<string, string>;
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
      "#services": "Leistungen",
      "#process": "Prozess",
      "#pricing": "Pakete",
      "#contact": "Kontakt",
    },
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
      "#services": "Services",
      "#process": "Process",
      "#pricing": "Pricing",
      "#contact": "Contact",
    },
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
