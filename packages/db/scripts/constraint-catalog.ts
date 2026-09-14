import type { getDatabaseClient } from "@invessiv/db/core";

type Sql = ReturnType<typeof getDatabaseClient>;
type ConstraintDefinitionRow = { conname: string; definition: string };
type NameRow = { name: string };

/** The literal values of every CHECK constraint on a table, sorted and keyed by constraint name. */
export async function readCheckConstraintValues(
  sql: Sql,
  tableName: string,
): Promise<Map<string, string[]>> {
  const rows = (await sql`
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = ${tableName}::regclass
      AND contype = 'c'
    `) as ConstraintDefinitionRow[];

  return new Map(
    rows.map((row) => [
      row.conname,
      [...row.definition.matchAll(/'([^']+)'/g)]
        .map((match) => match[1])
        .sort(),
    ]),
  );
}

export function hasSameValues(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return actual.join(",") === [...expected].sort().join(",");
}

/** Constraint or index names from the code that the connected database does not know. */
export async function findMissingConstraintNames(
  sql: Sql,
  names: readonly string[],
): Promise<string[]> {
  const expected = [...names];
  const rows = (await sql`
        SELECT conname AS name
        FROM pg_constraint
        WHERE conname = ANY (${expected})
        UNION
        SELECT indexname AS name
        FROM pg_indexes
        WHERE indexname = ANY (${expected})
    `) as NameRow[];
  const existing = new Set(rows.map((row) => row.name));

  return expected.filter((name) => !existing.has(name));
}
