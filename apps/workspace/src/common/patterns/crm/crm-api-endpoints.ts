import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";
import { FileApiPath } from "@/common/constants/files/file-api-paths";

const LEAD_CONVERSION_ACTION = "convert";
const PROJECTS_PATH = "projects";
const LINE_ITEMS_PATH = "line-items";
const TASKS_PATH = "tasks";
const TASK_STATUS_PATH = "status";
const MESSAGE_REDACT_PATH = "redact";

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

export function crmCustomerConversationEndpoint(customerId: string): string {
  return `${crmCustomerEndpoint(customerId)}/${ConversationApiPath.Conversation}`;
}

export function crmCustomerConversationMessagesEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${ConversationApiPath.Messages}`;
}

export function crmCustomerConversationReadEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${ConversationApiPath.Read}`;
}

export function crmCustomerConversationOwnerEndpoint(
  customerId: string,
): string {
  return `${crmCustomerConversationEndpoint(customerId)}/${ConversationApiPath.Owner}`;
}

export function crmMessageRedactEndpoint(messageId: string): string {
  return `${WorkspaceApiEndpoint.CrmMessages}/${encodeURIComponent(messageId)}/${MESSAGE_REDACT_PATH}`;
}

export function crmFileDownloadEndpoint(fileId: string): string {
  return `${crmFileEndpoint(fileId)}/${FileApiPath.Download}`;
}

export function crmCustomerFilesEndpoint(customerId: string): string {
  return `${crmCustomerEndpoint(customerId)}/${FileApiPath.Files}`;
}

export function crmCustomerFileUploadsEndpoint(customerId: string): string {
  return `${crmCustomerFilesEndpoint(customerId)}/${FileApiPath.Uploads}`;
}

export function crmCustomerFileLinksEndpoint(customerId: string): string {
  return `${crmCustomerFilesEndpoint(customerId)}/${FileApiPath.Links}`;
}

export function crmCustomerFilesArchiveEndpoint(customerId: string): string {
  return `${crmCustomerFilesEndpoint(customerId)}/${FileApiPath.Archive}`;
}

export function crmFileEndpoint(fileId: string): string {
  return `${WorkspaceApiEndpoint.CrmFiles}/${encodeURIComponent(fileId)}`;
}

export function crmFileCompleteEndpoint(fileId: string): string {
  return `${crmFileEndpoint(fileId)}/${FileApiPath.Complete}`;
}

export function crmFileCancelEndpoint(fileId: string): string {
  return `${crmFileEndpoint(fileId)}/${FileApiPath.Cancel}`;
}

export function crmFileDownloadUrlEndpoint(fileId: string): string {
  return `${crmFileEndpoint(fileId)}/${FileApiPath.DownloadUrl}`;
}
