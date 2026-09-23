import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const LEAD_CONVERSION_ACTION = "convert";
const PROJECTS_PATH = "projects";
const LINE_ITEMS_PATH = "line-items";
const TASKS_PATH = "tasks";
const TASK_STATUS_PATH = "status";

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

export function crmLineItemTemplateEndpoint(
  lineItemTemplateId: string,
): string {
  return `${WorkspaceApiEndpoint.CrmLineItemTemplates}/${encodeURIComponent(lineItemTemplateId)}`;
}

export function crmProjectLineItemsEndpoint(projectId: string): string {
  return `${crmProjectEndpoint(projectId)}/${LINE_ITEMS_PATH}`;
}

export function crmProjectLineItemEndpoint(projectLineItemId: string): string {
  return `${WorkspaceApiEndpoint.CrmProjectLineItems}/${encodeURIComponent(projectLineItemId)}`;
}

export function crmProjectTasksEndpoint(projectId: string): string {
  return `${crmProjectEndpoint(projectId)}/${TASKS_PATH}`;
}

export function crmTaskEndpoint(taskId: string): string {
  return `${WorkspaceApiEndpoint.CrmTasks}/${encodeURIComponent(taskId)}`;
}

export function crmTaskStatusEndpoint(taskId: string): string {
  return `${crmTaskEndpoint(taskId)}/${TASK_STATUS_PATH}`;
}
