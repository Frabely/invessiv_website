import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { HoursBreakdown } from "@invessiv/common/contracts/time/hours-breakdown";
import { hoursDistribution } from "@invessiv/common/patterns/time/hours-distribution";

/** Adapts the portal's anonymous earlier projects and company balance to the shared distribution. */
function of(hours: PortalHoursDto): HoursBreakdown {
  return hoursDistribution.companyFromProjects(
    {
      purchasedMinutes: hours.balance.purchasedMinutes,
      usedMinutes: hours.balance.usedMinutes,
      freeMinutes: hours.balance.unassignedMinutes,
    },
    hours.earlierProjects
      ? [...hours.projects, hours.earlierProjects]
      : hours.projects,
  );
}

export const portalHoursBreakdown = {
  of,
  companySegments: hoursDistribution.companySegments,
  projectSegments: hoursDistribution.projectSegments,
  projectUsage: hoursDistribution.projectUsage,
} as const;
