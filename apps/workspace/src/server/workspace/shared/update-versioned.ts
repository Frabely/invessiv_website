import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionedWriteResult } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type {
  VersionedPatch,
  VersionedTable,
} from "@/server/workspace/shared/update-versioned-types";

type VersionedRow<TTable extends VersionedTable> = TTable["$inferSelect"] & {
  version: number;
};

/**
 * The **only** way to update a versioned row.
 *
 * Runs exactly one atomic `UPDATE … WHERE id = $1 AND version = $2` and bumps `version`
 * in the same statement. The obvious alternative — read, compare the version, then write —
 * has a race window between the two statements and silently loses data there. This helper
 * wraps the statement so nobody has to write the wrong variant.
 *
 * If the `UPDATE` matches no row, the row is re-read once to tell `version_conflict` from
 * `not_found`: a deleted row must never surface in the UI as "someone was faster".
 */
export async function updateVersioned<
  TTable extends VersionedTable,
  TDto,
>(args: {
  tx: ContactDatabaseTransaction;
  table: TTable;
  id: string;
  expectedVersion: number;
  patch: VersionedPatch<TTable>;
  toDto: (row: VersionedRow<TTable>) => TDto;
}): Promise<VersionedWriteResult<TDto>> {
  const { tx, table, id, expectedVersion, patch, toDto } = args;

  // Drizzle loses the concrete row type for a generic table passed through its
  // transaction overload. The public patch and mapper remain tied to `TTable`; only the
  // query result is narrowed back to that same inferred row type here.
  const updatedRows = (await tx
    .update(table)
    .set({
      ...patch,
      version: sql`${table.version}
            + 1`,
      updated_at: new Date(),
    })
    .where(and(eq(table.id, id), eq(table.version, expectedVersion)))
    .returning()) as unknown as VersionedRow<TTable>[];

  if (updatedRows.length === 1) {
    return { ok: true, value: toDto(updatedRows[0]) };
  }

  const currentRows = (await tx
    .select()
    .from(table as PgTable)
    .where(eq(table.id, id))
    .limit(1)) as unknown as VersionedRow<TTable>[];

  if (currentRows.length === 0) {
    return { ok: false, code: ConcurrencyErrorCode.NotFound };
  }

  const current = currentRows[0];

  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: current.version,
      current: toDto(current),
    },
  };
}
