import type { Locale } from "@/config/i18n";
import formDe from "./form/de.json";
import formEn from "./form/en.json";
import listDe from "./list/de.json";
import listEn from "./list/en.json";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";

export type CrmMetaDictionary = typeof metaDe;
export type CrmShellDictionary = typeof shellDe;
export type CrmListDictionary = typeof listDe;
export type CrmFormDictionary = typeof formDe;

const CRM_META: Record<Locale, CrmMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const CRM_SHELL: Record<Locale, CrmShellDictionary> = {
  de: shellDe,
  en: shellEn,
};

const CRM_LIST: Record<Locale, CrmListDictionary> = {
  de: listDe,
  en: listEn,
};

const CRM_FORM: Record<Locale, CrmFormDictionary> = {
  de: formDe,
  en: formEn,
};

export function getCrmMetaDictionary(locale: Locale): CrmMetaDictionary {
  return CRM_META[locale];
}

export function getCrmShellDictionary(locale: Locale): CrmShellDictionary {
  return CRM_SHELL[locale];
}

export function getCrmListDictionary(locale: Locale): CrmListDictionary {
  return CRM_LIST[locale];
}

export function getCrmFormDictionary(locale: Locale): CrmFormDictionary {
  return CRM_FORM[locale];
}
