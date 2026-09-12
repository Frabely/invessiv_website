import type { PgColumn, PgTable, PgUpdateSetSource } from "drizzle-orm/pg-core";

export type VersionedTable = PgTable & {
  id: PgColumn;
  version: PgColumn;
  updated_at: PgColumn;
};

type ManagedVersionedColumn = "created_at" | "id" | "updated_at" | "version";

export type VersionedPatch<TTable extends VersionedTable> = Omit<
  PgUpdateSetSource<TTable>,
  ManagedVersionedColumn
>;
