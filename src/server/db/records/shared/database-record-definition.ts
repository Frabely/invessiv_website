import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

export type DatabaseRecordDefinition<
  TRecord extends object,
  TTableName extends string,
  TColumns extends readonly (keyof TRecord & string)[],
> = {
  columns: TColumns;
  tableName: TTableName;
};

export function defineDatabaseRecord<TRecord extends object>() {
  return <
    const TTableName extends string,
    const TColumns extends readonly (keyof TRecord & string)[],
  >(
    definition: DatabaseRecordDefinition<TRecord, TTableName, TColumns>,
  ) => definition;
}

export function defineDatabaseRecordFromTable<TRecord extends object>() {
  return <TTable extends PgTable>(table: TTable) => {
    const tableConfig = getTableConfig(table);

    return {
      columns: tableConfig.columns.map(
        (column) => column.name,
      ) as unknown as readonly (keyof TRecord & string)[],
      tableName: tableConfig.name as string,
    };
  };
}
