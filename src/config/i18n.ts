export type Locale = "de" | "en";

export const SUPPORTED_LOCALES = ["de", "en"] as const;

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
