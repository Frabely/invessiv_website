import "server-only";

import { inArray, or, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm/column";
import { AccessScopeKind } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessScope } from "@/common/patterns/auth/access-scope";

/** Columns needed to apply a resolved CRM access scope directly in the query. */
export type CrmAccessColumns = {
  customerId: AnyColumn;
  projectId?: AnyColumn;
};

/**
 * Returns no condition for workspace-wide permission and a deny-all condition for an empty scope.
 * A project binding never grants customer-wide rows: it only participates when a project column exists.
 */
function forScope(
  scope: AccessScope,
  columns: CrmAccessColumns,
): SQL | undefined {
  if (scope.kind === AccessScopeKind.All) return undefined;
  const conditions: SQL[] = [];
  if (scope.customerIds.size > 0)
    conditions.push(inArray(columns.customerId, [...scope.customerIds]));
  if (columns.projectId && scope.projectIds.size > 0)
    conditions.push(inArray(columns.projectId, [...scope.projectIds]));
  return conditions.length === 0
    ? inArray(columns.customerId, [])
    : or(...conditions);
}

export const crmAccessCondition = { forScope } as const;
