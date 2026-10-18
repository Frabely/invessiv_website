import { HoursSegmentKind } from "../../constants/time/hours-segment-kinds";
import type { HoursBreakdown } from "../../contracts/time/hours-breakdown";
import type { HoursMeterSegment } from "../../contracts/time/hours-meter-segment";
import type { HoursProjectUsage } from "../../contracts/time/hours-project-usage";
import type { ProjectHoursBalanceDto } from "../../contracts/crm/hours/project-hours-balance.dto";

type ProjectHours = Pick<
  ProjectHoursBalanceDto,
  "allocatedMinutes" | "usedMinutes" | "remainingMinutes"
>;

/** Aggregated projects must retain their individual positive and negative remainders. */
function projectUsage(
  project: ProjectHours | HoursProjectUsage,
): HoursProjectUsage {
  return {
    usedMinutes: project.usedMinutes,
    openMinutes:
      "openMinutes" in project
        ? project.openMinutes
        : Math.max(project.remainingMinutes, 0),
    overMinutes:
      "overMinutes" in project
        ? project.overMinutes
        : Math.max(-project.remainingMinutes, 0),
  };
}

/** Purchased = used + open + free − over; one project's overrun cannot consume another's remainder. */
function companyUsage(
  input: Omit<HoursBreakdown, "overMinutes">,
): HoursBreakdown {
  const freeMinutes = Math.max(input.freeMinutes, 0);
  return {
    ...input,
    freeMinutes,
    overMinutes: Math.max(
      input.usedMinutes +
        input.openMinutes +
        freeMinutes -
        input.purchasedMinutes,
      0,
    ),
  };
}

/**
 * The company split from its balance and every project that holds hours. Each project adds only
 * its own open remainder, so an overrun elsewhere cannot hide it.
 */
function companyFromProjects(
  balance: Omit<HoursBreakdown, "overMinutes" | "openMinutes">,
  projects: readonly (ProjectHours | HoursProjectUsage)[],
): HoursBreakdown {
  return companyUsage({
    ...balance,
    openMinutes: projects.reduce(
      (sum, project) => sum + projectUsage(project).openMinutes,
      0,
    ),
  });
}

function usageSegments(usage: HoursProjectUsage): HoursMeterSegment[] {
  return [
    {
      kind: HoursSegmentKind.Used,
      minutes: Math.max(usage.usedMinutes - usage.overMinutes, 0),
    },
    { kind: HoursSegmentKind.Over, minutes: usage.overMinutes },
    { kind: HoursSegmentKind.Open, minutes: usage.openMinutes },
  ];
}

function companySegments(breakdown: HoursBreakdown): HoursMeterSegment[] {
  return [
    ...usageSegments(breakdown),
    { kind: HoursSegmentKind.Free, minutes: breakdown.freeMinutes },
  ];
}

function projectSegments(
  project: ProjectHours | HoursProjectUsage,
): HoursMeterSegment[] {
  return usageSegments(projectUsage(project));
}

export const hoursDistribution = {
  projectUsage,
  companyUsage,
  companyFromProjects,
  companySegments,
  projectSegments,
} as const;
