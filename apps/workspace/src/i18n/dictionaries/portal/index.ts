import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import pickerDe from "./picker/de.json";
import pickerEn from "./picker/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";

export type PortalMetaDictionary = typeof metaDe;
export type PortalPickerDictionary = typeof pickerDe;
export type PortalShellDictionary = typeof shellDe;

const PORTAL_META: Record<Locale, PortalMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const PORTAL_PICKER: Record<Locale, PortalPickerDictionary> = {
  de: pickerDe,
  en: pickerEn,
};

const PORTAL_SHELL: Record<Locale, PortalShellDictionary> = {
  de: shellDe,
  en: shellEn,
};

export function getPortalMetaDictionary(locale: Locale): PortalMetaDictionary {
  return PORTAL_META[locale];
}

export function getPortalPickerDictionary(
  locale: Locale,
): PortalPickerDictionary {
  return PORTAL_PICKER[locale];
}

export function getPortalShellDictionary(
  locale: Locale,
): PortalShellDictionary {
  return PORTAL_SHELL[locale];
}
