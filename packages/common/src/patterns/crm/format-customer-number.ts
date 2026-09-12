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
