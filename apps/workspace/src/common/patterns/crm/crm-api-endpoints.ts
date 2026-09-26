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

const CONVERSATION_PATH = "conversation";
const CONVERSATION_MESSAGES_PATH = "messages";
const CONVERSATION_READ_PATH = "read";
const CONVERSATION_OWNER_PATH = "owner";
const MESSAGE_REDACT_PATH = "redact";

export function crmCustomerConversationEndpoint(customerId: string): string {
  return `${crmCustomerEndpoint(customerId)}/${CONVERSATION_PATH}`;
}

export function crmCustomerConversationMessagesEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${CONVERSATION_MESSAGES_PATH}`;
}

export function crmCustomerConversationReadEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${CONVERSATION_READ_PATH}`;
}

export function crmCustomerConversationOwnerEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${CONVERSATION_OWNER_PATH}`;
}

export function crmMessageRedactEndpoint(messageId: string): string {
  return `${WorkspaceApiEndpoint.CrmMessages}/${encodeURIComponent(messageId)}/${MESSAGE_REDACT_PATH}`;
}
