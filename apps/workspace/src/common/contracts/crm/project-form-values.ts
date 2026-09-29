import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";

/** Fields the project editor dialog edits; everything else is carried over from the stored project. */
export interface ProjectFormValues {
  title: string;
  status: ProjectStatus;
  plan: ProjectProcessPlan;
}
