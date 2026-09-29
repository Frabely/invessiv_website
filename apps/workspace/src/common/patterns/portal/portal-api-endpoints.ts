import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";
import { FeedbackApiPath } from "@/common/constants/feedback/feedback-api-paths";
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

export function portalProjectFeedbackEndpoint(
  customerId: string,
  projectId: string,
): string {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${FeedbackApiPath.Projects}/${encodeURIComponent(projectId)}/${FeedbackApiPath.Feedback}`;
}

function portalFeedbackRoundEndpoint(customerId: string, roundId: string) {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${FeedbackApiPath.FeedbackRounds}/${encodeURIComponent(roundId)}`;
}

export function portalFeedbackDraftEndpoint(
  customerId: string,
  roundId: string,
): string {
  return `${portalFeedbackRoundEndpoint(customerId, roundId)}/${FeedbackApiPath.Draft}`;
}

export function portalFeedbackSubmitEndpoint(
  customerId: string,
  roundId: string,
): string {
  return `${portalFeedbackRoundEndpoint(customerId, roundId)}/${FeedbackApiPath.Submit}`;
}

export function portalFeedbackApproveEndpoint(
  customerId: string,
  roundId: string,
): string {
  return `${portalFeedbackRoundEndpoint(customerId, roundId)}/${FeedbackApiPath.Approve}`;
}

export function portalFeedbackItemFilesEndpoint(
  customerId: string,
  roundId: string,
  itemId: string,
): string {
  return `${portalFeedbackRoundEndpoint(customerId, roundId)}/${FeedbackApiPath.Items}/${encodeURIComponent(itemId)}/${FeedbackApiPath.Files}`;
}

export function portalFeedbackItemFileEndpoint(
  customerId: string,
  roundId: string,
  itemId: string,
  fileId: string,
): string {
  return `${portalFeedbackItemFilesEndpoint(customerId, roundId, itemId)}/${encodeURIComponent(fileId)}`;
}
