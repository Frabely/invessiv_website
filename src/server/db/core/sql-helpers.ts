import { sql } from "drizzle-orm";
import type { Column } from "drizzle-orm";

/**
 * Builds a SQL IN-check from a trusted as-const array (e.g., LEAD_SOURCES_VALUES).
 * Uses sql.raw, so the values are inlined, not parameterized — safe only for compile-time constants.
 */
export function sqlCheckIn(column: Column, values: readonly string[]) {
  const list = values.map((v) => `'${v}'`).join(", ");
  return sql`${column} in (${sql.raw(list)})`;
}
