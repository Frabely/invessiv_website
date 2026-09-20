import type { Locale } from "@/config/i18n";
import formDe from "./form/de.json";
import formEn from "./form/en.json";
import listDe from "./list/de.json";
import listEn from "./list/en.json";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";
import cockpitDe from "./cockpit/de.json";
import cockpitEn from "./cockpit/en.json";
import servicesDe from "./services/de.json";
import servicesEn from "./services/en.json";
import accessDe from "./access/de.json";
import accessEn from "./access/en.json";

export type CrmMetaDictionary = typeof metaDe;
export type CrmShellDictionary = typeof shellDe;
export type CrmListDictionary = typeof listDe;
export type CrmFormDictionary = typeof formDe;
export type CrmCockpitDictionary = typeof cockpitDe;
export type CrmServicesDictionary = typeof servicesDe;
export type CrmAccessDictionary = typeof accessDe;

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
const CRM_COCKPIT: Record<Locale, CrmCockpitDictionary> = {
  de: cockpitDe,
  en: cockpitEn,
};
const CRM_SERVICES: Record<Locale, CrmServicesDictionary> = {
  de: servicesDe,
  en: servicesEn,
};
const CRM_ACCESS: Record<Locale, CrmAccessDictionary> = {
  de: accessDe,
  en: accessEn,
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
export function getCrmCockpitDictionary(locale: Locale): CrmCockpitDictionary {
  return CRM_COCKPIT[locale];
}

export function getCrmServicesDictionary(
  locale: Locale,
): CrmServicesDictionary {
  return CRM_SERVICES[locale];
}

export function getCrmAccessDictionary(locale: Locale): CrmAccessDictionary {
  return CRM_ACCESS[locale];
}
