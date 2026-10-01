import { Permission } from "@invessiv/common/constants/auth/permissions";

export const PermissionGroup = {
  Overview: "overview",
  Leads: "leads",
  Customers: "customers",
  Projects: "projects",
  Services: "services",
  Files: "files",
  Credentials: "credentials",
  Portal: "portal",
  Administration: "administration",
} as const;

export type PermissionGroup =
  (typeof PermissionGroup)[keyof typeof PermissionGroup];

export const PERMISSION_GROUP_VALUES = [
  PermissionGroup.Overview,
  PermissionGroup.Leads,
  PermissionGroup.Customers,
  PermissionGroup.Projects,
  PermissionGroup.Services,
  PermissionGroup.Files,
  PermissionGroup.Credentials,
  PermissionGroup.Portal,
  PermissionGroup.Administration,
] as const;

/** Display grouping for the role editor only. Authorization never reads it. */
export const PERMISSION_GROUP_PERMISSIONS = {
  [PermissionGroup.Overview]: [Permission.DashboardRead],
  [PermissionGroup.Leads]: [
    Permission.LeadsRead,
    Permission.LeadsWrite,
    Permission.LeadsDelete,
    Permission.LeadsImport,
    Permission.OutreachGenerate,
  ],
  [PermissionGroup.Customers]: [
    Permission.CustomersRead,
    Permission.CustomersWrite,
    Permission.ChatRead,
    Permission.ChatWrite,
    Permission.ChatRedact,
  ],
  [PermissionGroup.Projects]: [
    Permission.ProjectsRead,
    Permission.ProjectsWrite,
    Permission.ProjectLineItemsRead,
    Permission.ProjectLineItemsWrite,
    Permission.TasksRead,
    Permission.TasksWrite,
  ],
  [PermissionGroup.Services]: [
    Permission.LineItemTemplatesRead,
    Permission.LineItemTemplatesWrite,
    Permission.QuestionnaireTemplatesRead,
    Permission.QuestionnaireTemplatesWrite,
  ],
  [PermissionGroup.Files]: [
    Permission.FilesRead,
    Permission.FilesWrite,
    Permission.FilesDelete,
  ],
  [PermissionGroup.Credentials]: [
    Permission.CredentialsRead,
    Permission.CredentialsReveal,
    Permission.CredentialsWrite,
  ],
  [PermissionGroup.Portal]: [
    Permission.PortalAccessManage,
    Permission.PortalAccess,
    Permission.PortalProjectsRead,
    Permission.PortalTasksRead,
    Permission.PortalTasksComplete,
    Permission.PortalMessagesRead,
    Permission.PortalMessagesWrite,
    Permission.PortalFilesRead,
    Permission.PortalFilesWrite,
    Permission.PortalFeedbackRead,
    Permission.PortalFeedbackSubmit,
    Permission.PortalOnboardingRead,
    Permission.PortalOnboardingSubmit,
  ],
  [PermissionGroup.Administration]: [
    Permission.MembersRead,
    Permission.MembersManage,
    Permission.RolesManage,
    Permission.DataExport,
    Permission.DataPurge,
    Permission.SecurityAudit,
  ],
} as const satisfies Record<PermissionGroup, readonly Permission[]>;
