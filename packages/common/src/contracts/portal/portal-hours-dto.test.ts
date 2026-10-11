import { describe, expectTypeOf, it } from "vitest";
import type { PortalEarlierProjectsHoursDto } from "./portal-earlier-projects-hours.dto";
import type { PortalHourPurchaseDto } from "./portal-hour-purchase.dto";
import type { PortalHoursBalanceDto } from "./portal-hours-balance.dto";
import type { PortalHoursDto } from "./portal-hours.dto";
import type { PortalProjectHoursDto } from "./portal-project-hours.dto";
import type { PortalTimeEntryPageDto } from "./portal-time-entry-page.dto";
import type { PortalTimeEntryDto } from "./portal-time-entry.dto";

describe("portal hours contracts", () => {
  it("keeps team members, versions and task ids out of a time entry", () => {
    expectTypeOf<PortalTimeEntryDto>().not.toHaveProperty("memberId");
    expectTypeOf<PortalTimeEntryDto>().not.toHaveProperty(
      "performedByMemberId",
    );
    expectTypeOf<PortalTimeEntryDto>().not.toHaveProperty("version");
    expectTypeOf<PortalTimeEntryDto>().not.toHaveProperty("taskId");
    expectTypeOf<PortalTimeEntryDto>().not.toHaveProperty("customerId");
    expectTypeOf<
      PortalTimeEntryPageDto["entries"][number]
    >().toEqualTypeOf<PortalTimeEntryDto>();
  });

  it("keeps the author and the ledger id out of a purchase", () => {
    expectTypeOf<PortalHourPurchaseDto>().not.toHaveProperty(
      "createdByMemberId",
    );
    expectTypeOf<PortalHourPurchaseDto>().not.toHaveProperty("id");
    expectTypeOf<PortalHourPurchaseDto>().not.toHaveProperty("source");
  });

  it("exposes sums only: no allocation rows, rates or budgets", () => {
    expectTypeOf<PortalHoursDto>().not.toHaveProperty("allocations");
    expectTypeOf<PortalHoursDto>().not.toHaveProperty("hourlyRate");
    expectTypeOf<PortalHoursDto>().not.toHaveProperty("budget");
    expectTypeOf<PortalProjectHoursDto>().not.toHaveProperty("hourlyRate");
    expectTypeOf<PortalProjectHoursDto>().not.toHaveProperty("budget");
    expectTypeOf<PortalProjectHoursDto>().not.toHaveProperty("status");
    expectTypeOf<PortalProjectHoursDto>().not.toHaveProperty("goodwillMinutes");
    expectTypeOf<PortalHoursBalanceDto>().not.toHaveProperty("goodwillMinutes");
    expectTypeOf<PortalEarlierProjectsHoursDto>().not.toHaveProperty("title");
    expectTypeOf<PortalEarlierProjectsHoursDto>().not.toHaveProperty(
      "projectId",
    );
  });
});
