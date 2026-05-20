export type RelativeTimeDictionary = {
  justNow: string;
  hoursAgo: string;
  daysAgo: string;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ABSOLUTE_THRESHOLD_DAYS = 30;

function interpolate(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function formatAbsoluteDate(locale: string, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(isoDate),
  );
}

export function formatRelativeTime(
  locale: string,
  isoDate: string,
  dictionary: RelativeTimeDictionary,
): string {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return isoDate;
  }

  const diffMs = Math.max(0, Date.now() - timestamp);

  if (diffMs < HOUR_MS) {
    return dictionary.justNow;
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return interpolate(dictionary.hoursAgo, hours);
  }

  const days = Math.floor(diffMs / DAY_MS);
  if (days < ABSOLUTE_THRESHOLD_DAYS) {
    return interpolate(dictionary.daysAgo, days);
  }

  return formatAbsoluteDate(locale, isoDate);
}
