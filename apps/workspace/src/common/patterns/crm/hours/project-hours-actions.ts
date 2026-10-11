import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";

/** Creation depends on status; correcting existing entries remains a write capability. */
export function projectHoursActions(options: {
  project: CustomerHoursProjectDto;
  canWrite: boolean;
  canManage: boolean;
  freeMinutes: number | null;
}) {
  const { project, canWrite, canManage, freeMinutes } = options;
  const closed = HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(project.status);
  const hasUnusedHours = project.releasableMinutes > 0;
  const finished = closed || project.status === ProjectStatus.Completed;
  return {
    closed,
    canWrite,
    canBook: canWrite && !closed,
    canAllocate: canManage && !closed && (freeMinutes ?? 0) > 0,
    canRelease: canManage && hasUnusedHours,
    showFinishedHint: finished && hasUnusedHours,
  };
}
