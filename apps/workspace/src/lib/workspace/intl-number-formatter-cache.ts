import type { Locale } from "@/config/i18n";

/**
 * `Intl.NumberFormat` construction is comparatively expensive; this returns a getter that reuses
 * one instance per locale instead of building a new formatter on every call.
 */
export function createNumberFormatterCache(
  options?: Intl.NumberFormatOptions,
): (locale: Locale) => Intl.NumberFormat {
  const cache = new Map<Locale, Intl.NumberFormat>();

  return (locale: Locale) => {
    const cached = cache.get(locale);
    if (cached) {
      return cached;
    }
    const formatter = new Intl.NumberFormat(locale, options);
    cache.set(locale, formatter);
    return formatter;
  };
}
