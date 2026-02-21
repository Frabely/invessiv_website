import { defaultLocale, Locale, locales } from "@/config/i18n";

export function resolveLocale(value: string | undefined): Locale {
  if (!value) {
    return defaultLocale;
  }

  const normalized = value.toLowerCase();

  return locales.includes(normalized as Locale)
    ? (normalized as Locale)
    : defaultLocale;
}
