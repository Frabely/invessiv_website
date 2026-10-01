import type { Locale } from "@invessiv/common";

/**
 * The name of a content locale in the language of the interface ("Englisch" in a German UI).
 * Derived from the locale itself, so a new locale needs no dictionary entry.
 */
export function languageName(locale: Locale, interfaceLocale: Locale): string {
  const name = new Intl.DisplayNames([interfaceLocale], {
    type: "language",
  }).of(locale);
  return name ?? locale;
}

/** "Englisch, Französisch" for the missing-language hint. */
export function languageList(
  locales: readonly Locale[],
  interfaceLocale: Locale,
): string {
  return new Intl.ListFormat([interfaceLocale], {
    style: "short",
    type: "conjunction",
  }).format(locales.map((locale) => languageName(locale, interfaceLocale)));
}
