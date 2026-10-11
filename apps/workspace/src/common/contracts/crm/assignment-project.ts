import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

export type AssignmentProject = {
  id: string;
  customerId: string;
  status: ProjectStatus;
};
