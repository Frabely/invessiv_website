import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import paginationDe from "./pagination/de.json";
import paginationEn from "./pagination/en.json";
import sharedDe from "./shared/de.json";
import sharedEn from "./shared/en.json";
import tableDe from "./table/de.json";
import tableEn from "./table/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";

export type LeadsMetaDictionary = typeof metaDe;
export type LeadsPaginationDictionary = typeof paginationDe;
export type LeadsSharedDictionary = typeof sharedDe;
export type LeadsTableDictionary = typeof tableDe;
export type LeadsShellDictionary = typeof shellDe;

const LEADS_META: Record<Locale, LeadsMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const LEADS_SHARED: Record<Locale, LeadsSharedDictionary> = {
  de: sharedDe,
  en: sharedEn,
};

const LEADS_PAGINATION: Record<Locale, LeadsPaginationDictionary> = {
  de: paginationDe,
  en: paginationEn,
};

const LEADS_TABLE: Record<Locale, LeadsTableDictionary> = {
  de: tableDe,
  en: tableEn,
};

const LEADS_SHELL: Record<Locale, LeadsShellDictionary> = {
  de: shellDe,
  en: shellEn,
};

export function getLeadsMetaDictionary(locale: Locale): LeadsMetaDictionary {
  return LEADS_META[locale];
}

export function getLeadsSharedDictionary(
  locale: Locale,
): LeadsSharedDictionary {
  return LEADS_SHARED[locale];
}

export function getLeadsPaginationDictionary(
  locale: Locale,
): LeadsPaginationDictionary {
  return LEADS_PAGINATION[locale];
}

export function getLeadsTableDictionary(locale: Locale): LeadsTableDictionary {
  return LEADS_TABLE[locale];
}

export function getLeadsShellDictionary(locale: Locale): LeadsShellDictionary {
  return LEADS_SHELL[locale];
}
