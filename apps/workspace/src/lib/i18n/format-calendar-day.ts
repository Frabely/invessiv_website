import type { Locale } from "@/config/i18n";

/** A due day has no time: parsing and printing it in UTC keeps it the same day everywhere. */
export function formatCalendarDay(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
