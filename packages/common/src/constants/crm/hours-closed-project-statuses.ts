import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

/**
 * Projects that take no new hours: nothing is allocated to them and no time is booked on them.
 * Releasing what is still allocated stays possible, so their hours never get stuck.
 */
export const HOURS_CLOSED_PROJECT_STATUS_VALUES: readonly ProjectStatus[] = [
  ProjectStatus.Cancelled,
  ProjectStatus.Archived,
];
