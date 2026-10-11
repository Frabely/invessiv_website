import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { canOn } from "@/common/patterns/auth/can-on";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import { calculateProjectLineItemValue } from "@invessiv/common/patterns/crm/project-line-item-value";
import { listProjectLineItemsByCustomer } from "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export async function buildCustomerListViewModel(
  customerList: Awaited<ReturnType<typeof listCustomers>>,
  actor: WorkspaceActor,
) {
  const customerListWithValues = {
    ...customerList,
    rows: await Promise.all(
      customerList.rows.map(async (customer) => {
        const hasCustomerGrant = actor.customerPermissions
          .get(customer.id)
          ?.has(Permission.ProjectLineItemsRead);
        const hasProjectGrant = [...actor.projectPermissions.values()].some(
          (scope) =>
            scope.customerId === customer.id &&
            scope.permissions.has(Permission.ProjectLineItemsRead),
        );
        const canReadProjectLineItems =
          can(actor, Permission.ProjectLineItemsRead) ||
          hasCustomerGrant ||
          hasProjectGrant;
        if (!canReadProjectLineItems) return customer;
        return {
          ...customer,
          projectLineItemValue: calculateProjectLineItemValue(
            await listProjectLineItemsByCustomer(customer.id, actor),
          ),
        };
      }),
    ),
  };
  const writableCustomerIds = new Set(
    customerList.rows
      .filter((row) =>
        canOn(actor, Permission.CustomersWrite, { customerId: row.id }),
      )
      .map((row) => row.id),
  );
  return { customerListWithValues, writableCustomerIds };
}
