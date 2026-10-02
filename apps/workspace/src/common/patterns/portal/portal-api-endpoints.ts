import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";
import { ProjectApiPath } from "@/common/constants/crm/project-api-paths";
import { FeedbackApiPath } from "@/common/constants/feedback/feedback-api-paths";
import { FileApiPath } from "@/common/constants/files/file-api-paths";
import { PortalOnboardingApiPath } from "@/common/constants/portal/portal-onboarding-api-paths";

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
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${ProjectApiPath.Projects}/${encodeURIComponent(projectId)}/${FeedbackApiPath.Feedback}`;
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

function portalOnboardingFormEndpoint(customerId: string, formId: string) {
  return `${WorkspaceApiEndpoint.Portal}/${encodeURIComponent(customerId)}/${PortalOnboardingApiPath.Onboarding}/${encodeURIComponent(formId)}`;
}

export function portalOnboardingAnswersEndpoint(
  customerId: string,
  formId: string,
): string {
  return `${portalOnboardingFormEndpoint(customerId, formId)}/${PortalOnboardingApiPath.Answers}`;
}

export function portalOnboardingSubmitEndpoint(
  customerId: string,
  formId: string,
): string {
  return `${portalOnboardingFormEndpoint(customerId, formId)}/${PortalOnboardingApiPath.Submit}`;
}

export function portalOnboardingGroupEntriesEndpoint(
  customerId: string,
  formId: string,
): string {
  return `${portalOnboardingFormEndpoint(customerId, formId)}/${PortalOnboardingApiPath.GroupEntries}`;
}

export function portalOnboardingGroupEntryEndpoint(
  customerId: string,
  formId: string,
  entryId: string,
): string {
  return `${portalOnboardingGroupEntriesEndpoint(customerId, formId)}/${encodeURIComponent(entryId)}`;
}

export function portalOnboardingGroupEntryMoveEndpoint(
  customerId: string,
  formId: string,
  entryId: string,
): string {
  return `${portalOnboardingGroupEntryEndpoint(customerId, formId, entryId)}/${PortalOnboardingApiPath.Move}`;
}

export function portalOnboardingFilesEndpoint(
  customerId: string,
  formId: string,
): string {
  return `${portalOnboardingFormEndpoint(customerId, formId)}/${PortalOnboardingApiPath.Files}`;
}

/** Addresses the link between form and file, not the file itself. */
export function portalOnboardingFileEndpoint(
  customerId: string,
  formId: string,
  answerFileId: string,
): string {
  return `${portalOnboardingFilesEndpoint(customerId, formId)}/${encodeURIComponent(answerFileId)}`;
}

export function portalOnboardingServicesConfirmationEndpoint(
  customerId: string,
  formId: string,
): string {
  return `${portalOnboardingFormEndpoint(customerId, formId)}/${PortalOnboardingApiPath.ServicesConfirmation}`;
}
