import "server-only";

import { and, eq, inArray, or } from "drizzle-orm";

import { AccessScopeKind } from "@invessiv/common/constants/auth/access-scope-types";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import {
  customerContactAssignments,
  customers,
  people,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { CrmDatabaseExecutor } from "@/server/workspace/crm/crm-types";
import {
  type AccessScope,
  canReadCustomerInScope,
} from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { customerCockpitMappingService } from "./customer-cockpit-mapping-service";

async function findById(
  executor: CrmDatabaseExecutor,
  customerId: string,
  scope: AccessScope,
  baseCustomerIds: ReadonlySet<string>,
): Promise<CustomerCockpitDto | null> {
  const [row] = await executor
    .select({
      id: customers.id,
      customerNumber: customers.customer_number,
      displayName: customers.display_name,
      status: customers.status,
      ownerDisplayName: users.display_name,
      primaryContactName: people.display_name,
      primaryContactEmail: customerContactAssignments.business_email,
      personalPrimaryContactEmail: people.primary_email,
    })
    .from(customers)
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, customers.owner_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .innerJoin(
      customerContactAssignments,
      and(
        eq(customerContactAssignments.customer_id, customers.id),
        eq(customerContactAssignments.is_primary, true),
      ),
    )
    .innerJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(
      and(
        eq(customers.id, customerId),
        scope.kind === AccessScopeKind.All
          ? undefined
          : or(
              crmAccessCondition.forScope(scope, { customerId: customers.id }),
              inArray(customers.id, [...baseCustomerIds]),
            ),
      ),
    )
    .limit(1);

  if (!row) return null;

  const customer = customerCockpitMappingService.toDto({
    ...row,
    primaryContactEmail:
      row.primaryContactEmail ?? row.personalPrimaryContactEmail,
  });
  return canReadCustomerInScope(scope, customerId)
    ? customer
    : {
        ...customer,
        ownerDisplayName: null,
        primaryContactName: null,
        primaryContactEmail: null,
      };
}

export const customerCockpitReadService = { findById } as const;
