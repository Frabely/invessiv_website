import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

/** The summed ledger rows of one project, before any balance is derived from them. */
export type ProjectHoursSums = {
  projectId: string;
  title: string;
  status: ProjectStatus;
  allocatedMinutes: number;
  usedMinutes: number;
  goodwillMinutes: number;
};
