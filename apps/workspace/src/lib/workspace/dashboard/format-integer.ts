import type { Locale } from "@/config/i18n";
import { createNumberFormatterCache } from "@/lib/workspace/intl-number-formatter-cache";

const getIntegerFormatter = createNumberFormatterCache({
  maximumFractionDigits: 0,
});

export function formatIntegerCount(value: number, locale: Locale): string {
  return getIntegerFormatter(locale).format(value);
}
