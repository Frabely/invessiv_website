import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import toolbarDe from "./toolbar/de.json";
import toolbarEn from "./toolbar/en.json";
import paginationDe from "./pagination/de.json";
import paginationEn from "./pagination/en.json";
import sharedDe from "./shared/de.json";
import sharedEn from "./shared/en.json";
import tableDe from "./table/de.json";
import tableEn from "./table/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";
import detailDe from "./detail/de.json";
import detailEn from "./detail/en.json";
import formDe from "./form/de.json";
import formEn from "./form/en.json";
import importDe from "./import/de.json";
import importEn from "./import/en.json";

export type LeadsMetaDictionary = typeof metaDe;
export type LeadsToolbarDictionary = typeof toolbarDe;
export type LeadsPaginationDictionary = typeof paginationDe;
export type LeadsSharedDictionary = typeof sharedDe;
export type LeadsTableDictionary = typeof tableDe;
export type LeadsShellDictionary = typeof shellDe;
export type LeadsDetailDictionary = typeof detailDe;
export type LeadsFormDictionary = typeof formDe;
export type LeadsImportDictionary = typeof importDe;

const LEADS_META: Record<Locale, LeadsMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const LEADS_TOOLBAR: Record<Locale, LeadsToolbarDictionary> = {
  de: toolbarDe,
  en: toolbarEn,
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

const LEADS_DETAIL: Record<Locale, LeadsDetailDictionary> = {
  de: detailDe,
  en: detailEn,
};

const LEADS_FORM: Record<Locale, LeadsFormDictionary> = {
  de: formDe,
  en: formEn,
};

const LEADS_IMPORT: Record<Locale, LeadsImportDictionary> = {
  de: importDe,
  en: importEn,
};

export function getLeadsMetaDictionary(locale: Locale): LeadsMetaDictionary {
  return LEADS_META[locale];
}

export function getLeadsToolbarDictionary(
  locale: Locale,
): LeadsToolbarDictionary {
  return LEADS_TOOLBAR[locale];
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

export function getLeadsDetailDictionary(
  locale: Locale,
): LeadsDetailDictionary {
  return LEADS_DETAIL[locale];
}

export function getLeadsFormDictionary(locale: Locale): LeadsFormDictionary {
  return LEADS_FORM[locale];
}

export function getLeadsImportDictionary(
  locale: Locale,
): LeadsImportDictionary {
  return LEADS_IMPORT[locale];
}
