import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import pageDe from "./page/de.json";
import pageEn from "./page/en.json";

export type DashboardMetaContent = typeof metaDe;
export type DashboardPageContent = typeof pageDe;

const DASHBOARD_META_CONTENT: Record<Locale, DashboardMetaContent> = {
  de: metaDe,
  en: metaEn,
};

const DASHBOARD_PAGE_CONTENT: Record<Locale, DashboardPageContent> = {
  de: pageDe,
  en: pageEn,
};

export function getDashboardMetaContent(locale: Locale): DashboardMetaContent {
  return DASHBOARD_META_CONTENT[locale];
}

export function getDashboardPageContent(locale: Locale): DashboardPageContent {
  return DASHBOARD_PAGE_CONTENT[locale];
}
