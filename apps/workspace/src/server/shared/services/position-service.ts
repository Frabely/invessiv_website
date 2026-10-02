import "server-only";

import { and, gt, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable, PgUpdateSetSource } from "drizzle-orm/pg-core";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";

/**
 * Closes the gap a deleted row leaves in a position list: every row behind it moves up by one, in
 * one statement, which the deferrable unique index checks as a whole. `scope` narrows the list the
 * position belongs to (one slot, one group, one form).
 */
async function closeGap<TTable extends PgTable & { position: PgColumn }>(
  tx: ContactDatabaseTransaction,
  table: TTable,
  scope: SQL | undefined,
  removedPosition: number,
): Promise<void> {
  await tx
    .update(table)
    .set({
      position: sql`${table.position} - 1`,
    } as unknown as PgUpdateSetSource<TTable>)
    .where(and(scope, gt(table.position, removedPosition)));
}

/**
 * Runs position writes that cross each other, such as a swap of two neighbours: the unique index
 * of the list is checked once at the end instead of after every row.
 */
async function withDeferredPositions<TResult>(
  tx: ContactDatabaseTransaction,
  constraintName: string,
  write: () => Promise<TResult>,
): Promise<TResult> {
  const constraint = sql.identifier(constraintName);
  await tx.execute(sql`set constraints ${constraint} deferred`);
  const result = await write();
  await tx.execute(sql`set constraints ${constraint} immediate`);
  return result;
}

export const positionService = { closeGap, withDeferredPositions } as const;
