const CUSTOMER_NUMBER_PREFIX = "K";
const CUSTOMER_NUMBER_MIN_DIGITS = 4;

/**
 * 1 → "K0001", 10000 → "K10000". Display only — sorting and filtering use the number.
 * Padded to four digits, growing freely beyond that.
 */
export function formatCustomerNumber(value: number): string {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(
      `formatCustomerNumber expects a positive integer, received: ${value}`,
    );
  }

  return `${CUSTOMER_NUMBER_PREFIX}${String(value).padStart(
    CUSTOMER_NUMBER_MIN_DIGITS,
    "0",
  )}`;
}

const CUSTOMER_NUMBER_INPUT = new RegExp(
  `^${CUSTOMER_NUMBER_PREFIX}?(\\d+)$`,
  "i",
);

/**
 * Reads a typed number with or without the display prefix: "2", "0002" and "K0002" are all 2.
 * Null for anything outside 1…`max`, so an oversized value never reaches the integer column.
 */
export function parseCustomerNumberInput(
  input: string,
  max: number,
): number | null {
  const digits = CUSTOMER_NUMBER_INPUT.exec(input.trim())?.[1];
  if (!digits) return null;
  const value = Number(digits);
  return value >= 1 && value <= max ? value : null;
}
