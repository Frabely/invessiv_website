import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { PortalEarlierProjectsHoursDto } from "@invessiv/common/contracts/portal/portal-earlier-projects-hours.dto";
import type { PortalHourPurchaseDto } from "@invessiv/common/contracts/portal/portal-hour-purchase.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalProjectHoursDto } from "@invessiv/common/contracts/portal/portal-project-hours.dto";
import type { PortalTimeEntryDto } from "@invessiv/common/contracts/portal/portal-time-entry.dto";
import type { PortalHourPurchaseRow } from "@invessiv/common/contracts/portal/rows/portal-hour-purchase-row";
import type { PortalTimeEntryRow } from "@invessiv/common/contracts/portal/rows/portal-time-entry-row";
import { computeProjectHoursBalance } from "@invessiv/common/patterns/crm/hours/hours-balance";
import { comparePortalCurrentProjects } from "@/common/patterns/portal/compare-portal-current-projects";
import type { ProjectHoursSums } from "@invessiv/common/contracts/crm/hours/project-hours-sums";

type PortalHoursSource = {
  balance: CustomerHoursBalanceDto;
  /** Every project of the company, oldest first, as `hoursBalanceService.loadProjectSums` returns them. */
  projectSums: readonly ProjectHoursSums[];
  visibleProjectIds: ReadonlySet<string>;
  /** Newest first, already capped. */
  purchaseRows: readonly PortalHourPurchaseRow[];
  canReadEntries: boolean;
};

type PortalTimeEntryView = {
  visibleProjectIds: ReadonlySet<string>;
  /** True only for readers with `portal.tasks.read`. */
  showTaskTitles: boolean;
};

function hasHours(project: ProjectHoursSums): boolean {
  return (
    project.allocatedMinutes !== 0 ||
    project.usedMinutes !== 0 ||
    project.goodwillMinutes !== 0
  );
}

function toProjectDto(project: ProjectHoursSums): PortalProjectHoursDto {
  const balance = computeProjectHoursBalance(project);
  return {
    projectId: project.projectId,
    title: project.title,
    allocatedMinutes: balance.allocatedMinutes,
    usedMinutes: balance.usedMinutes,
    remainingMinutes: balance.remainingMinutes,
  };
}

/** One sum over everything the portal hides, so the rows still add up to the company balance. */
function toEarlierProjectsDto(
  hidden: readonly ProjectHoursSums[],
): PortalEarlierProjectsHoursDto | null {
  if (hidden.length === 0) return null;
  const allocatedMinutes = hidden.reduce(
    (total, project) => total + project.allocatedMinutes,
    0,
  );
  const usedMinutes = hidden.reduce(
    (total, project) => total + project.usedMinutes,
    0,
  );
  return {
    allocatedMinutes,
    usedMinutes,
    remainingMinutes: allocatedMinutes - usedMinutes,
  };
}

function toPurchaseDto(row: PortalHourPurchaseRow): PortalHourPurchaseDto {
  return {
    purchasedOn: row.purchased_on,
    minutes: row.minutes,
    isCorrection: row.kind === HourPurchaseKind.Correction,
    note: row.note,
  };
}

function toHoursDto(source: PortalHoursSource): PortalHoursDto {
  const withHours = source.projectSums.filter(hasHours);
  return {
    balance: {
      purchasedMinutes: source.balance.purchasedMinutes,
      usedMinutes: source.balance.usedMinutes,
      remainingMinutes: source.balance.remainingMinutes,
      unassignedMinutes: source.balance.freeMinutes,
    },
    // Match the dashboard's status groups, newest first within each group.
    projects: withHours
      .filter((project) => source.visibleProjectIds.has(project.projectId))
      .reverse()
      .sort(comparePortalCurrentProjects)
      .map(toProjectDto),
    earlierProjects: toEarlierProjectsDto(
      withHours.filter(
        (project) => !source.visibleProjectIds.has(project.projectId),
      ),
    ),
    purchases: source.purchaseRows.map(toPurchaseDto),
    canReadEntries: source.canReadEntries,
  };
}

function toTimeEntryDto(
  row: PortalTimeEntryRow,
  view: PortalTimeEntryView,
): PortalTimeEntryDto {
  return {
    id: row.id,
    projectId: view.visibleProjectIds.has(row.project_id)
      ? row.project_id
      : null,
    performedOn: row.performed_on,
    durationMinutes: row.duration_minutes,
    description: row.description,
    billable: row.billable,
    taskTitle:
      view.showTaskTitles && row.task_visible_to_customer === true
        ? row.task_title
        : null,
  };
}

/** The only place a portal hours DTO is built: member ids, versions and allocation rows end here. */
export const portalHoursMappingService = {
  toHoursDto,
  toTimeEntryDto,
} as const;
