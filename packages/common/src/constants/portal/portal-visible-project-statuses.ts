import { ProjectStatus } from "../crm/project-statuses";

/**
 * Project statuses whose project and tasks the portal may show at all. Archived and cancelled
 * projects stay internal — also for direct task ids, not only in lists.
 */
export const PORTAL_VISIBLE_PROJECT_STATUS_VALUES = [
  ProjectStatus.Planned,
  ProjectStatus.Active,
  ProjectStatus.Paused,
  ProjectStatus.Completed,
] as const;
