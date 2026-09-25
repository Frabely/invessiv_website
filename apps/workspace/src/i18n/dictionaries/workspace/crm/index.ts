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
import projectLineItemsDe from "./project-line-items/de.json";
import projectLineItemsEn from "./project-line-items/en.json";
import lineItemTemplatesDe from "./line-item-templates/de.json";
import lineItemTemplatesEn from "./line-item-templates/en.json";
import tasksDe from "./tasks/de.json";
import tasksEn from "./tasks/en.json";
import accessDe from "./access/de.json";
import accessEn from "./access/en.json";
import portalAccessDe from "./portal-access/de.json";
import portalAccessEn from "./portal-access/en.json";

export type CrmMetaDictionary = typeof metaDe;
export type CrmShellDictionary = typeof shellDe;
export type CrmListDictionary = typeof listDe;
export type CrmFormDictionary = typeof formDe;
export type CrmCockpitDictionary = typeof cockpitDe;
export type CrmProjectLineItemsDictionary = typeof projectLineItemsDe;
export type CrmLineItemTemplatesDictionary = typeof lineItemTemplatesDe;
export type CrmTasksDictionary = typeof tasksDe;
export type CrmAccessDictionary = typeof accessDe;
export type CrmPortalAccessDictionary = typeof portalAccessDe;

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
const CRM_PROJECT_LINE_ITEMS: Record<Locale, CrmProjectLineItemsDictionary> = {
  de: projectLineItemsDe,
  en: projectLineItemsEn,
};
const CRM_LINE_ITEM_TEMPLATES: Record<Locale, CrmLineItemTemplatesDictionary> =
  {
    de: lineItemTemplatesDe,
    en: lineItemTemplatesEn,
  };
const CRM_TASKS: Record<Locale, CrmTasksDictionary> = {
  de: tasksDe,
  en: tasksEn,
};
const CRM_ACCESS: Record<Locale, CrmAccessDictionary> = {
  de: accessDe,
  en: accessEn,
};
const CRM_PORTAL_ACCESS: Record<Locale, CrmPortalAccessDictionary> = {
  de: portalAccessDe,
  en: portalAccessEn,
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

export function getCrmLineItemTemplatesDictionary(
  locale: Locale,
): CrmLineItemTemplatesDictionary {
  return CRM_LINE_ITEM_TEMPLATES[locale];
}

export function getCrmAccessDictionary(locale: Locale): CrmAccessDictionary {
  return CRM_ACCESS[locale];
}

export function getCrmPortalAccessDictionary(
  locale: Locale,
): CrmPortalAccessDictionary {
  return CRM_PORTAL_ACCESS[locale];
}

export function getCrmProjectLineItemsDictionary(
  locale: Locale,
): CrmProjectLineItemsDictionary {
  return CRM_PROJECT_LINE_ITEMS[locale];
}

export function getCrmTasksDictionary(locale: Locale): CrmTasksDictionary {
  return CRM_TASKS[locale];
}
