import "server-only";

import { inArray, or, type SQL } from "drizzle-orm";
import { AccessScopeKind } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessScope } from "@/common/patterns/auth/access-scope";
import type { CrmAccessColumns } from "@/server/workspace/shared/services/crm-access-condition-types";

/**
 * Returns no condition for workspace-wide permission and a deny-all condition for an empty scope.
 * Without a project column (a customer list) the customers of project bindings stay visible, so a
 * project-only member finds the customer of their project. With a project column, a project binding
 * narrows to that project and never grants customer-wide rows.
 */
function forScope(
  scope: AccessScope,
  columns: CrmAccessColumns,
): SQL | undefined {
  if (scope.kind === AccessScopeKind.All) return undefined;
  const conditions: SQL[] = [];
  const visibleCustomerIds = columns.projectId
    ? scope.customerIds
    : new Set([...scope.customerIds, ...scope.projectCustomerIds]);
  if (visibleCustomerIds.size > 0)
    conditions.push(inArray(columns.customerId, [...visibleCustomerIds]));
  if (columns.projectId && scope.projectIds.size > 0)
    conditions.push(inArray(columns.projectId, [...scope.projectIds]));
  return conditions.length === 0
    ? inArray(columns.customerId, [])
    : or(...conditions);
}

export const crmAccessCondition = { forScope } as const;
