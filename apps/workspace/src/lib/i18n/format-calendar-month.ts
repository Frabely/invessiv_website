import type { Locale } from "@/config/i18n";

/** `YYYY-MM` as "Oktober 2026"; printed in UTC so the month never shifts with the viewer's zone. */
export function formatCalendarMonth(isoMonth: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoMonth}-01T00:00:00Z`));
}
