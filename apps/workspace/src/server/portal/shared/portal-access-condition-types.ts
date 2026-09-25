import type { AnyColumn } from "drizzle-orm/column";

/** Columns that identify the customer-owned row a portal query is about to return. */
export type PortalAccessColumns = {
  customerId: AnyColumn;
  projectId?: AnyColumn;
};
