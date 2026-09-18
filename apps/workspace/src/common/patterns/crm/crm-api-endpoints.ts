import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const LEAD_CONVERSION_ACTION = "convert";
const PROJECTS_PATH = "projects";

export function crmCustomerEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}`;
}

export function crmCustomerProjectsEndpoint(customerId: string): string {
  return `${crmCustomerEndpoint(customerId)}/${PROJECTS_PATH}`;
}

export function crmProjectEndpoint(projectId: string): string {
  return `${WorkspaceApiEndpoint.CrmProjects}/${encodeURIComponent(projectId)}`;
}

export function crmLeadConversionEndpoint(leadId: string): string {
  return `${WorkspaceApiEndpoint.CrmLeadConversions}/${encodeURIComponent(leadId)}/${LEAD_CONVERSION_ACTION}`;
}

export function crmServiceTemplateEndpoint(serviceTemplateId: string): string {
  return `${WorkspaceApiEndpoint.CrmServiceTemplates}/${encodeURIComponent(serviceTemplateId)}`;
}
