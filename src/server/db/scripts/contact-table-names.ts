import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "@/server/db/record-configuration";

const TABLE_NAMES = Object.values(schema)
  .map((table) => getTableConfig(table).name)
  .sort((left, right) => left.localeCompare(right));

export function getTableNames() {
  return [...TABLE_NAMES];
}
