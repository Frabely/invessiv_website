const POSTGRES_INTEGER_MAX = 2_147_483_647;
const DIGITS_ONLY = /^\d+$/;

/**
 * Reads a purely numeric search as a customer number, so the exact match can be listed first.
 * Anything that is not a positive number the integer column can hold yields null: comparing an
 * oversized value would fail the whole query instead of finding nothing.
 */
export function parseExactCustomerNumber(search: string): number | null {
  if (!DIGITS_ONLY.test(search)) return null;
  const value = Number(search);
  return value > 0 && value <= POSTGRES_INTEGER_MAX ? value : null;
}
