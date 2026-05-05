import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "@/server/db/record-configuration";

const CONTACT_TABLE_NAMES = Object.values(schema)
  .map((table) => getTableConfig(table).name)
  .sort((left, right) => left.localeCompare(right));

export function getContactTableNames() {
  return [...CONTACT_TABLE_NAMES];
}
