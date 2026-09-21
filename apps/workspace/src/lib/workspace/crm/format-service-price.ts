import type { Locale } from "@/config/i18n";
import { createNumberFormatterCache } from "@/lib/workspace/intl-number-formatter-cache";

const getCurrencyFormatter = createNumberFormatterCache({
  style: "currency",
  currency: "EUR",
});

/** Net EUR cents as a localized amount. The catalog has no other currency. */
export function formatEuroCents(cents: number, locale: Locale): string {
  return getCurrencyFormatter(locale).format(cents / 100);
}
