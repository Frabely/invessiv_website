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
