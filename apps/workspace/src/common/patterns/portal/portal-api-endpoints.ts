import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";
import { FileApiPath } from "@/common/constants/files/file-api-paths";

const TASKS_PATH = "tasks";
const TASK_COMPLETE_PATH = "complete";

export function portalTaskCompleteEndpoint(
  customerId: string,
  taskId: string,
): string {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${TASKS_PATH}/${encodeURIComponent(taskId)}/${TASK_COMPLETE_PATH}`;
}

export function portalConversationEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${ConversationApiPath.Conversation}`;
}

export function portalConversationMessagesEndpoint(customerId: string): string {
  return `${portalConversationEndpoint(customerId)}/${ConversationApiPath.Messages}`;
}

export function portalConversationReadEndpoint(customerId: string): string {
  return `${portalConversationEndpoint(customerId)}/${ConversationApiPath.Read}`;
}

export function portalFilesEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${FileApiPath.Files}`;
}

export function portalFileUploadsEndpoint(customerId: string): string {
  return `${portalFilesEndpoint(customerId)}/${FileApiPath.Uploads}`;
}

export function portalFileLinksEndpoint(customerId: string): string {
  return `${portalFilesEndpoint(customerId)}/${FileApiPath.Links}`;
}

export function portalFilesArchiveEndpoint(customerId: string): string {
  return `${portalFilesEndpoint(customerId)}/${FileApiPath.Archive}`;
}

export function portalFileEndpoint(customerId: string, fileId: string): string {
  return `${portalFilesEndpoint(customerId)}/${encodeURIComponent(fileId)}`;
}

export function portalFileCompleteEndpoint(
  customerId: string,
  fileId: string,
): string {
  return `${portalFileEndpoint(customerId, fileId)}/${FileApiPath.Complete}`;
}

export function portalFileCancelEndpoint(
  customerId: string,
  fileId: string,
): string {
  return `${portalFileEndpoint(customerId, fileId)}/${FileApiPath.Cancel}`;
}

export function portalFileDownloadUrlEndpoint(
  customerId: string,
  fileId: string,
): string {
  return `${portalFileEndpoint(customerId, fileId)}/${FileApiPath.DownloadUrl}`;
}

export function portalFileDownloadEndpoint(
  customerId: string,
  fileId: string,
): string {
  return `${portalFileEndpoint(customerId, fileId)}/${FileApiPath.Download}`;
}
