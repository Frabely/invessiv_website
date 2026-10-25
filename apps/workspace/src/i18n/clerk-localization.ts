import { deDE, enUS } from "@clerk/localizations";
import type { Locale } from "@/config/i18n";
import type { AccountDictionary } from "@/common/contracts/auth/account-dictionary";
import de from "./dictionaries/account/de.json";
import en from "./dictionaries/account/en.json";

const account: Record<Locale, AccountDictionary> = { de, en };
const base: Record<Locale, typeof deDE> = { de: deDE, en: enUS };

function mergeTranslations<T extends object>(
  original: T,
  overrides: object,
): T {
  const result = { ...original };
  for (const [key, value] of Object.entries(overrides)) {
    const name = key as keyof T;
    const current = original[name];
    result[name] = (
      value &&
      typeof value === "object" &&
      current &&
      typeof current === "object"
        ? mergeTranslations(current, value)
        : value
    ) as T[keyof T];
  }
  return result;
}

/** Keep the localized defaults for every account label that does not need an override. */
export function getClerkLocalization(locale: Locale) {
  return mergeTranslations(base[locale], account[locale]);
}
