import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { HoursBreakdown } from "@invessiv/common/contracts/time/hours-breakdown";
import { hoursDistribution } from "@invessiv/common/patterns/time/hours-distribution";

/** Adapts the portal's anonymous earlier projects and company balance to the shared distribution. */
function of(hours: PortalHoursDto): HoursBreakdown {
  return hoursDistribution.companyUsage({
    purchasedMinutes: hours.balance.purchasedMinutes,
    usedMinutes: hours.balance.usedMinutes,
    freeMinutes: hours.balance.unassignedMinutes,
    openMinutes: hours.projects.reduce(
      (sum, project) =>
        sum + hoursDistribution.projectUsage(project).openMinutes,
      hours.earlierProjects?.openMinutes ?? 0,
    ),
  });
}

export const portalHoursBreakdown = {
  of,
  companySegments: hoursDistribution.companySegments,
  projectSegments: hoursDistribution.projectSegments,
  projectUsage: hoursDistribution.projectUsage,
} as const;
