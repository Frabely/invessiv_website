import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { CustomerHoursDto } from "@invessiv/common/contracts/crm/hours/customer-hours.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerHourPurchases,
  projectHourAllocations,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/**
 * The hours of one customer, narrowed to what the actor may read. Customer-wide access shows the
 * stock, the purchases and every project; a project binding shows only its own projects and
 * neither the stock nor the purchases. Null when the actor reads hours nowhere on this customer —
 * the area then does not exist. At most four statements, independent of the number of projects.
 */
export async function getCustomerHours(
  customerId: string,
  actor: WorkspaceActor,
): Promise<CustomerHoursDto | null> {
  if (!hoursSchemas.entityId.safeParse(customerId).success) return null;

  const db = getDrizzleDatabaseClient();
  const customerWide = canOn(actor, Permission.HoursRead, { customerId });
  const projectSums = await hoursBalanceService.loadProjectSums(
    db,
    customerId,
    crmAccessCondition.forScope(accessScope(actor, Permission.HoursRead), {
      customerId: projects.customer_id,
      projectId: projects.id,
    }),
  );
  if (!customerWide && projectSums.length === 0) return null;

  const projectIds = projectSums.map((project) => project.projectId);
  const [purchasedMinutes, purchaseRows, allocationRows] = await Promise.all([
    customerWide
      ? hoursBalanceService.loadPurchasedMinutes(db, customerId)
      : null,
    customerWide
      ? db
          .select()
          .from(customerHourPurchases)
          .where(eq(customerHourPurchases.customer_id, customerId))
          .orderBy(
            desc(customerHourPurchases.purchased_on),
            desc(customerHourPurchases.created_at),
          )
          .limit(HoursLimits.HistoryPreviewSize)
      : [],
    projectIds.length > 0
      ? db
          .select()
          .from(projectHourAllocations)
          .where(
            and(
              eq(projectHourAllocations.customer_id, customerId),
              inArray(projectHourAllocations.project_id, projectIds),
            ),
          )
          .orderBy(desc(projectHourAllocations.created_at))
          .limit(HoursLimits.HistoryPreviewSize)
      : [],
  ]);

  return {
    // With customer-wide access the scope admits every project, so the sums are complete.
    balance:
      purchasedMinutes === null
        ? null
        : hoursBalanceService.toCustomerBalance(purchasedMinutes, projectSums),
    projects: projectSums.map(hoursMappingService.toCustomerProjectDto),
    purchases: purchaseRows.map(hoursMappingService.toPurchaseDto),
    allocations: allocationRows.map(hoursMappingService.toAllocationDto),
  };
}
