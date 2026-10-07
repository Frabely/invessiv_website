import { Permission } from "@invessiv/common/constants/auth/permissions";

/**
 * Exhaustive access contract for every currently implemented CRM API route.
 * `scope` means that a route admits bound roles and verifies the concrete customer/project in
 * its query or command; `workspace` deliberately requires a global permission.
 */
export const CrmEndpointAccessRule = {
  FilesList: "files_list",
  FilesArchive: "files_archive",
  FileUpload: "file_upload",
  FileComplete: "file_complete",
  FileCancel: "file_cancel",
  FileLink: "file_link",
  FileUpdate: "file_update",
  FileDelete: "file_delete",
  FileDownloadUrl: "file_download_url",
  FileDownload: "file_download",
  CredentialsList: "credentials_list",
  CredentialCreate: "credential_create",
  CredentialUpdate: "credential_update",
  CredentialDelete: "credential_delete",
  CredentialReveal: "credential_reveal",
  CustomerAccessScopes: "customer_access_scopes",
  PortalInvitationCreate: "portal_invitation_create",
  CustomerCreate: "customer_create",
  CustomerDetail: "customer_detail",
  CustomerUpdate: "customer_update",
  CustomerProjects: "customer_projects",
  Customers: "customers",
  LeadConversion: "lead_conversion",
  ProjectDetail: "project_detail",
  ProjectCreate: "project_create",
  ProjectLineItemDetail: "project_line_item_detail",
  ProjectLineItems: "project_line_items",
  ProjectLineItemCreate: "project_line_item_create",
  LineItemTemplateDetail: "line_item_template_detail",
  LineItemTemplateCreate: "line_item_template_create",
  LineItemTemplates: "line_item_templates",
  QuestionnaireCatalog: "questionnaire_catalog",
  QuestionnaireCatalogWrite: "questionnaire_catalog_write",
  Tasks: "tasks",
  TaskCreate: "task_create",
  TaskDetail: "task_detail",
  TaskStatusChange: "task_status_change",
  CustomerConversation: "customer_conversation",
  CustomerConversationWrite: "customer_conversation_write",
  ConversationOwnerUpdate: "conversation_owner_update",
  MessageRedact: "message_redact",
  FeedbackRounds: "feedback_rounds",
  FeedbackRoundHandOver: "feedback_round_hand_over",
  FeedbackRoundDetail: "feedback_round_detail",
  FeedbackRoundStatusChange: "feedback_round_status_change",
  FeedbackItemResult: "feedback_item_result",
  FeedbackInbox: "feedback_inbox",
  FeedbackRoundRead: "feedback_round_read",
  OnboardingForm: "onboarding_form",
  OnboardingFormWrite: "onboarding_form_write",
  OnboardingFormTemplateApply: "onboarding_form_template_apply",
} as const;

export type CrmEndpointAccessRule =
  (typeof CrmEndpointAccessRule)[keyof typeof CrmEndpointAccessRule];

export const CRM_ENDPOINT_ACCESS_RULES = {
  [CrmEndpointAccessRule.FilesList]: {
    permission: Permission.FilesRead,
    scope: "list",
  },
  [CrmEndpointAccessRule.FilesArchive]: {
    permission: Permission.FilesRead,
    scope: "customer",
  },
  [CrmEndpointAccessRule.FileUpload]: {
    permission: Permission.FilesWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileComplete]: {
    permission: Permission.FilesWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileCancel]: {
    permission: Permission.FilesWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileLink]: {
    permission: Permission.FilesWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileUpdate]: {
    permission: Permission.FilesWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileDelete]: {
    permission: Permission.FilesDelete,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileDownloadUrl]: {
    permission: Permission.FilesRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.FileDownload]: {
    permission: Permission.FilesRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.CredentialsList]: {
    permission: Permission.CredentialsRead,
    scope: "list",
  },
  [CrmEndpointAccessRule.CredentialCreate]: {
    permission: Permission.CredentialsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.CredentialUpdate]: {
    permission: Permission.CredentialsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.CredentialDelete]: {
    permission: Permission.CredentialsWrite,
    scope: "project",
  },
  // Reveal has its own permission: reading the list never implies seeing a secret.
  [CrmEndpointAccessRule.CredentialReveal]: {
    permission: Permission.CredentialsReveal,
    scope: "project",
  },
  [CrmEndpointAccessRule.CustomerAccessScopes]: {
    permission: Permission.MembersManage,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.PortalInvitationCreate]: {
    permission: Permission.PortalAccessManage,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerCreate]: {
    permission: Permission.CustomersWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.CustomerDetail]: {
    permission: Permission.CustomersRead,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerUpdate]: {
    permission: Permission.CustomersWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerProjects]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.Customers]: {
    permission: Permission.CustomersRead,
    scope: "list",
  },
  [CrmEndpointAccessRule.LeadConversion]: {
    permission: Permission.CustomersWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.ProjectDetail]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectCreate]: {
    permission: Permission.ProjectsWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.ProjectLineItemDetail]: {
    permission: Permission.ProjectLineItemsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectLineItems]: {
    permission: Permission.ProjectLineItemsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectLineItemCreate]: {
    permission: Permission.ProjectLineItemsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.LineItemTemplateDetail]: {
    permission: Permission.LineItemTemplatesWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.LineItemTemplateCreate]: {
    permission: Permission.LineItemTemplatesWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.LineItemTemplates]: {
    permission: Permission.LineItemTemplatesRead,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.QuestionnaireCatalog]: {
    permission: Permission.QuestionnaireTemplatesRead,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.QuestionnaireCatalogWrite]: {
    permission: Permission.QuestionnaireTemplatesWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.Tasks]: {
    permission: Permission.TasksRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.TaskCreate]: {
    permission: Permission.TasksWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.TaskDetail]: {
    permission: Permission.TasksWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.TaskStatusChange]: {
    permission: Permission.TasksWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.CustomerConversation]: {
    permission: Permission.ChatRead,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerConversationWrite]: {
    permission: Permission.ChatWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.ConversationOwnerUpdate]: {
    permission: Permission.ChatWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.MessageRedact]: {
    permission: Permission.ChatRedact,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.FeedbackRounds]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.FeedbackRoundHandOver]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FeedbackRoundDetail]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.FeedbackRoundStatusChange]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FeedbackItemResult]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.FeedbackInbox]: {
    permission: Permission.ProjectsRead,
    scope: "list",
  },
  [CrmEndpointAccessRule.FeedbackRoundRead]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.OnboardingForm]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.OnboardingFormWrite]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.OnboardingFormTemplateApply]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
} as const satisfies Record<
  CrmEndpointAccessRule,
  {
    permission: Permission;
    scope: "customer" | "list" | "project" | "workspace";
  }
>;
