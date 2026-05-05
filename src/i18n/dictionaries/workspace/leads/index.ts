import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";

export type LeadsMetaDictionary = typeof metaDe;
export type LeadsShellDictionary = typeof shellDe;

const LEADS_META: Record<Locale, LeadsMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const LEADS_SHELL: Record<Locale, LeadsShellDictionary> = {
  de: shellDe,
  en: shellEn,
};

export function getLeadsMetaDictionary(locale: Locale): LeadsMetaDictionary {
  return LEADS_META[locale];
}

export function getLeadsShellDictionary(locale: Locale): LeadsShellDictionary {
  return LEADS_SHELL[locale];
}
