import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";

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
