import type { Locale } from "@/config/i18n";

const integerFormatterCache = new Map<Locale, Intl.NumberFormat>();

function getIntegerFormatter(locale: Locale): Intl.NumberFormat {
  const cached = integerFormatterCache.get(locale);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  integerFormatterCache.set(locale, formatter);
  return formatter;
}

export function formatIntegerCount(value: number, locale: Locale): string {
  return getIntegerFormatter(locale).format(value);
}
