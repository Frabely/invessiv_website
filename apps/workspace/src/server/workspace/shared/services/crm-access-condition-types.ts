import type { AnyColumn } from "drizzle-orm/column";

/** Columns required to apply a resolved CRM access scope to a Drizzle query. */
export type CrmAccessColumns = {
  customerId: AnyColumn;
  projectId?: AnyColumn;
};
