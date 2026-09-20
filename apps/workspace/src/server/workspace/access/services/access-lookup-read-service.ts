import "server-only";

import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import { customers, projects } from "@invessiv/db/record-configuration";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { parseExactCustomerNumber } from "@/common/patterns/access/customer-number-search";
import { escapeLikePattern } from "@/common/patterns/crm/sql-like-escape";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { accessLookupMappingService } from "@/server/workspace/access/services/access-lookup-mapping-service";

/**
 * Finds customers by name or number, capped at `AccessLookupResultLimit`. Deliberately not
 * filtered by the caller's CRM scope, and deliberately without an actor parameter: whoever may
 * manage access has to be able to name every customer. Only the identifying columns are
 * selected, so the lookup cannot leak CRM content.
 */
async function searchCustomers(
  executor: AccessDatabaseExecutor,
  search: string,
): Promise<AccessCustomerOptionDto[]> {
  const pattern = search ? `%${escapeLikePattern(search)}%` : null;
  const exactNumber = parseExactCustomerNumber(search);
  const rows = await executor
    .select({
      id: customers.id,
      customer_number: customers.customer_number,
      display_name: customers.display_name,
    })
    .from(customers)
    .where(
      pattern
        ? or(
            ilike(customers.display_name, pattern),
            sql`${customers.customer_number}
                    ::text ilike
                    ${pattern}`,
          )
        : undefined,
    )
    // Without this, a short number such as "1" is answered in name order and the customer with
    // exactly that number can fall out of the capped result.
    .orderBy(
      ...(exactNumber === null
        ? []
        : [desc(eq(customers.customer_number, exactNumber))]),
      asc(customers.display_name),
      asc(customers.id),
    )
    .limit(AccessFieldLimits.AccessLookupResultLimit);

  return rows.map(accessLookupMappingService.mapCustomerRow);
}

/** Complete, stable option list used by the bounded customer picker in role assignment. */
async function listCustomerOptions(
  executor: AccessDatabaseExecutor,
): Promise<AccessCustomerOptionDto[]> {
  const rows = await executor
    .select({
      id: customers.id,
      customer_number: customers.customer_number,
      display_name: customers.display_name,
    })
    .from(customers)
    .orderBy(
      asc(customers.customer_number),
      asc(customers.display_name),
      asc(customers.id),
    );

  return rows.map(accessLookupMappingService.mapCustomerRow);
}

/** All projects of one customer, not capped: a cap would silently drop projects from the tree. */
async function listProjectsOfCustomer(
  executor: AccessDatabaseExecutor,
  customerId: string,
): Promise<AccessProjectOptionDto[]> {
  const rows = await executor
    .select({
      id: projects.id,
      customer_id: projects.customer_id,
      title: projects.title,
    })
    .from(projects)
    .where(eq(projects.customer_id, customerId))
    .orderBy(asc(projects.title), asc(projects.id));

  return rows.map(accessLookupMappingService.mapProjectRow);
}

export const accessLookupReadService = {
  listCustomerOptions,
  listProjectsOfCustomer,
  searchCustomers,
} as const;
