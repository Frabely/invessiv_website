import type { EuroCentsParseResult } from "@/common/contracts/crm/euro-cents-parse-result";

// One optional decimal separator and at most two decimals; thousands separators are
// rejected because "1.500" would be ambiguous between locales.
const EURO_AMOUNT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

export function parseEuroAmountToCents(input: string): EuroCentsParseResult {
  const normalized = input.replace(/[\s€]/g, "");
  if (!normalized) {
    return { ok: true, cents: null };
  }

  const match = EURO_AMOUNT_PATTERN.exec(normalized);
  if (!match) {
    return { ok: false };
  }

  const euros = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return { ok: true, cents: euros * 100 + cents };
}

/** Whole euros stay without decimals so an untouched value round-trips unchanged. */
export function formatCentsAsEuroInput(
  cents: number | null,
  locale: string,
): string {
  if (cents === null) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}
