import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";

/**
 * A project exposed in the customer cockpit. Project-line-item access only reveals the stable
 * reference required to select the project; the complete project record requires projects.read.
 */
export type CockpitProjectDto = {
  id: string;
  title: string;
  project: ProjectDto | null;
};
