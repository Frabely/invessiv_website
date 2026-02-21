import { Locale } from "@/config/i18n";
import { deDictionary } from "@/content/i18n/de";
import { enDictionary } from "@/content/i18n/en";
import { SiteDictionary } from "@/content/i18n/types";

const dictionaries: Record<Locale, SiteDictionary> = {
  de: deDictionary,
  en: enDictionary,
};

export function getDictionary(locale: Locale): SiteDictionary {
  return dictionaries[locale];
}
