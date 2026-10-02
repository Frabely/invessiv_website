import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ConversationApiPath } from "@/common/constants/crm/conversation-api-paths";
import { OnboardingApiPath } from "@/common/constants/crm/onboarding-api-paths";
import { QuestionnaireApiPath } from "@/common/constants/crm/questionnaire/questionnaire-api-paths";
import { ProjectApiPath } from "@/common/constants/crm/project-api-paths";
import { FeedbackApiPath } from "@/common/constants/feedback/feedback-api-paths";
import { FileApiPath } from "@/common/constants/files/file-api-paths";

const LEAD_CONVERSION_ACTION = "convert";
const LINE_ITEMS_PATH = "line-items";
const TASKS_PATH = "tasks";
const TASK_STATUS_PATH = "status";
const MESSAGE_REDACT_PATH = "redact";

export function crmCustomerEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}`;
}

export function crmCustomerProjectsEndpoint(customerId: string): string {
  return `${crmCustomerEndpoint(customerId)}/${ProjectApiPath.Projects}`;
}

export function crmProjectEndpoint(projectId: string): string {
  return `${WorkspaceApiEndpoint.CrmProjects}/${encodeURIComponent(projectId)}`;
}

export function crmProjectFeedbackRoundsEndpoint(projectId: string): string {
  return `${crmProjectEndpoint(projectId)}/${FeedbackApiPath.FeedbackRounds}`;
}

export function crmFeedbackRoundEndpoint(roundId: string): string {
  return `${WorkspaceApiEndpoint.CrmFeedbackRounds}/${encodeURIComponent(roundId)}`;
}

export function crmFeedbackRoundStatusEndpoint(roundId: string): string {
  return `${crmFeedbackRoundEndpoint(roundId)}/${FeedbackApiPath.Status}`;
}

export function crmFeedbackRoundReadEndpoint(roundId: string): string {
  return `${crmFeedbackRoundEndpoint(roundId)}/${FeedbackApiPath.Read}`;
}

export function crmFeedbackItemResultEndpoint(itemId: string): string {
  return `${WorkspaceApiEndpoint.CrmFeedbackRoundItems}/${encodeURIComponent(itemId)}/${FeedbackApiPath.Result}`;
}

export function crmLeadConversionEndpoint(leadId: string): string {
  return `${WorkspaceApiEndpoint.CrmLeadConversions}/${encodeURIComponent(leadId)}/${LEAD_CONVERSION_ACTION}`;
}

export function crmLineItemTemplateEndpoint(
  lineItemTemplateId: string,
): string {
  return `${WorkspaceApiEndpoint.CrmLineItemTemplates}/${encodeURIComponent(lineItemTemplateId)}`;
}

export function crmQuestionnaireBlockEndpoint(blockId: string): string {
  return `${WorkspaceApiEndpoint.CrmQuestionnaireBlocks}/${encodeURIComponent(blockId)}`;
}

export function crmQuestionnaireBlockDuplicateEndpoint(
  blockId: string,
): string {
  return `${crmQuestionnaireBlockEndpoint(blockId)}/${QuestionnaireApiPath.Duplicate}`;
}

export function crmQuestionnaireBlockFieldsEndpoint(blockId: string): string {
  return `${crmQuestionnaireBlockEndpoint(blockId)}/${QuestionnaireApiPath.Fields}`;
}

export function crmQuestionnaireFieldEndpoint(fieldId: string): string {
  return `${WorkspaceApiEndpoint.CrmQuestionnaireFields}/${encodeURIComponent(fieldId)}`;
}

export function crmQuestionnaireFieldMoveEndpoint(fieldId: string): string {
  return `${crmQuestionnaireFieldEndpoint(fieldId)}/${QuestionnaireApiPath.Move}`;
}

export function crmQuestionnaireTemplateEndpoint(templateId: string): string {
  return `${WorkspaceApiEndpoint.CrmQuestionnaireTemplates}/${encodeURIComponent(templateId)}`;
}

export function crmProjectOnboardingEndpoint(projectId: string): string {
  return `${crmProjectEndpoint(projectId)}/${OnboardingApiPath.Onboarding}`;
}

export function crmOnboardingFormEndpoint(formId: string): string {
  return `${WorkspaceApiEndpoint.CrmOnboardingForms}/${encodeURIComponent(formId)}`;
}

export function crmOnboardingFormBlocksEndpoint(formId: string): string {
  return `${crmOnboardingFormEndpoint(formId)}/${OnboardingApiPath.Blocks}`;
}

export function crmOnboardingFormBlockEndpoint(
  formId: string,
  blockId: string,
): string {
  return `${crmOnboardingFormBlocksEndpoint(formId)}/${encodeURIComponent(blockId)}`;
}

export function crmOnboardingFormBlockMoveEndpoint(
  formId: string,
  blockId: string,
): string {
  return `${crmOnboardingFormBlockEndpoint(formId, blockId)}/${OnboardingApiPath.Move}`;
}

export function crmOnboardingFormBlockFieldsEndpoint(
  formId: string,
  blockId: string,
): string {
  return `${crmOnboardingFormBlockEndpoint(formId, blockId)}/${OnboardingApiPath.Fields}`;
}

export function crmOnboardingFormFieldEndpoint(
  formId: string,
  fieldId: string,
): string {
  return `${crmOnboardingFormEndpoint(formId)}/${OnboardingApiPath.Fields}/${encodeURIComponent(fieldId)}`;
}

export function crmOnboardingFormFieldMoveEndpoint(
  formId: string,
  fieldId: string,
): string {
  return `${crmOnboardingFormFieldEndpoint(formId, fieldId)}/${OnboardingApiPath.Move}`;
}

export function crmOnboardingFormFieldUsageEndpoint(
  formId: string,
  fieldId: string,
): string {
  return `${crmOnboardingFormFieldEndpoint(formId, fieldId)}/${OnboardingApiPath.Usage}`;
}

export function crmOnboardingFormReleaseEndpoint(formId: string): string {
  return `${crmOnboardingFormEndpoint(formId)}/${OnboardingApiPath.Release}`;
}

export function crmOnboardingFormRequestChangesEndpoint(
  formId: string,
): string {
  return `${crmOnboardingFormEndpoint(formId)}/${OnboardingApiPath.RequestChanges}`;
}

export function crmOnboardingFormBlockReviewEndpoint(
  formId: string,
  blockId: string,
): string {
  return `${crmOnboardingFormBlockEndpoint(formId, blockId)}/${OnboardingApiPath.Review}`;
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
