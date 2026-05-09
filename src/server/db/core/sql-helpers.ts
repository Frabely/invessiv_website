import type { Column } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Builds a SQL IN-check from a trusted as-const array (e.g., LEAD_SOURCES_VALUES).
 * Uses sql.raw, so the values are inlined, not parameterized. Only pass
 * compile-time constants from readonly tuples derived from const objects.
 */
export function sqlCheckIn<
  const TValues extends readonly [string, ...string[]],
>(column: Column, values: TValues) {
  const list = values.map((v) => `'${v}'`).join(", ");
  return sql`${column} in (${sql.raw(list)})`;
}
