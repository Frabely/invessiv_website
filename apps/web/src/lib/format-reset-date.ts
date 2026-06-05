import type { Locale } from "@/config/i18n";

/**
 * Locale-safe long date for the usage-limit reset (e.g. "1. Juli 2026" /
 * "July 1, 2026"). Uses the runtime locale directly — no de/en branch — so
 * further locales work without structural change. Returns an empty string for
 * an unparsable input so callers can omit the reset hint.
 */
export function formatResetDate(resetAt: string, locale: Locale): string {
  const parsed = new Date(resetAt);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}
