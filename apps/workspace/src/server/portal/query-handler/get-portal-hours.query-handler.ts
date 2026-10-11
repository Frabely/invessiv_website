import "server-only";

import { desc } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerHourPurchases } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalHoursMappingService } from "@/server/portal/services/hours/portal-hours-mapping-service";
import { portalHoursService } from "@/server/portal/services/hours/portal-hours-service";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";

/**
 * The company's hours for the dashboard widget and its dialog. The sums cover every project of
 * the company, whatever its status, so they match the cockpit; only the breakdown by name is
 * limited to projects the portal shows. Null without `portal.hours.read` and for a company that
 * never bought hours and has no time entry — the widget then does not exist.
 */
export async function getPortalHours(
  reader: PortalReader,
): Promise<PortalHoursDto | null> {
  if (!portalHoursService.can(reader, Permission.PortalHoursRead)) return null;

  const db = getDrizzleDatabaseClient();
  const [purchasedMinutes, projectSums, purchaseRows, visibleProjectIds] =
    await Promise.all([
      hoursBalanceService.loadPurchasedMinutes(db, reader.customerId),
      hoursBalanceService.loadProjectSums(db, reader.customerId),
      db
        .select({
          kind: customerHourPurchases.kind,
          minutes: customerHourPurchases.minutes,
          purchased_on: customerHourPurchases.purchased_on,
          note: customerHourPurchases.note,
        })
        .from(customerHourPurchases)
        .where(
          portalHoursService.condition(reader, Permission.PortalHoursRead, {
            customerId: customerHourPurchases.customer_id,
          }),
        )
        .orderBy(
          desc(customerHourPurchases.purchased_on),
          desc(customerHourPurchases.created_at),
        )
        .limit(HoursLimits.HistoryPreviewSize),
      portalHoursService.visibleProjectIds(reader, Permission.PortalHoursRead),
    ]);

  const balance = hoursBalanceService.toCustomerBalance(
    purchasedMinutes,
    projectSums,
  );
  // A purchase that was corrected back to zero still counts as content: there is a history to show.
  if (
    purchaseRows.length === 0 &&
    balance.usedMinutes === 0 &&
    balance.goodwillMinutes === 0
  )
    return null;

  return portalHoursMappingService.toHoursDto({
    balance,
    projectSums,
    visibleProjectIds,
    purchaseRows,
    canReadEntries: portalHoursService.can(
      reader,
      Permission.PortalHoursEntriesRead,
    ),
  });
}
