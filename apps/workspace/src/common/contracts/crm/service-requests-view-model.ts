import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ServiceRequestProjectOption } from "./service-request-project-option";
import type { ProjectProcessPlan } from "./project-process-plan";
import type { LineItemAssignmentBlockers } from "./line-item-assignment-blockers";
export type ServiceRequestsViewModel = {
  requests: ServiceRequestDto[];
  canWrite: boolean;
  canCreateProject: boolean;
  canCreateTemplate: boolean;
  /** Without the catalog there is nothing to assign from; the dialog then names that reason. */
  canReadTemplates: boolean;
  projects: ServiceRequestProjectOption[];
  templates: LineItemTemplateDto[];
  blockers: Record<string, LineItemAssignmentBlockers>;
  defaultPlan: ProjectProcessPlan;
  selectedRequestId: string | null;
};
