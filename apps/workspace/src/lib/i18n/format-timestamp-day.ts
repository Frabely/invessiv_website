import type { Locale } from "@/config/i18n";

/** The calendar day of a moment in the viewer's time zone, e.g. "01.10.2026" or "Oct 1, 2026". */
export function formatTimestampDay(
  isoTimestamp: string,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(isoTimestamp),
  );
}
