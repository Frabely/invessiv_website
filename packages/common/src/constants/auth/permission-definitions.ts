import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import type { PermissionDefinition } from "@invessiv/common/contracts/auth/permission-definition";

/**
 * Single source of truth for the permission catalog. The migration mirrors every entry into
 * `permissions`; `db:smoke:rbac` fails as soon as code and database diverge.
 */
export const PERMISSION_DEFINITIONS = {
  [Permission.DashboardRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View the workspace dashboard.",
  },
  [Permission.LeadsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View leads and their history.",
  },
  [Permission.LeadsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Create, edit and archive leads.",
  },
  [Permission.LeadsDelete]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Permanently delete leads.",
  },
  [Permission.LeadsImport]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Import leads from CSV files.",
  },
  [Permission.OutreachGenerate]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Generate outreach message drafts.",
  },
  [Permission.MembersRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "List workspace members, e.g. to pick an owner.",
  },
  [Permission.CustomersRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View customers and contacts.",
  },
  [Permission.CustomersWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Create, edit, archive and reassign customers.",
  },
  [Permission.ProjectsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View projects and tasks.",
  },
  [Permission.ProjectsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Create, edit and reassign projects.",
  },
  [Permission.TasksWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Create, edit and reassign tasks.",
  },
  [Permission.FilesRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View and download customer files.",
  },
  [Permission.FilesWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Upload files and change their portal visibility.",
  },
  [Permission.FilesDelete]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Delete customer files.",
  },
  [Permission.CredentialsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "View credential metadata without secret values.",
  },
  [Permission.CredentialsReveal]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Reveal and copy a single credential secret.",
  },
  [Permission.CredentialsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Create, change and delete credentials.",
  },
  [Permission.PortalAccessManage]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    description: "Invite and revoke customer portal access.",
  },
  [Permission.RolesManage]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    description: "Create and change roles.",
  },
  [Permission.MembersManage]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    description: "Add, deactivate and assign roles to members.",
  },
  [Permission.DataExport]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    description: "Export customer data.",
  },
  [Permission.DataPurge]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    description: "Irreversibly purge a customer.",
  },
  [Permission.SecurityAudit]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    description: "Read the security event log.",
  },
} as const satisfies Record<Permission, PermissionDefinition>;

export const WORKSPACE_PERMISSION_VALUES: readonly Permission[] =
  PERMISSION_VALUES.filter(
    (permission) =>
      PERMISSION_DEFINITIONS[permission].realm === AuthRealm.Workspace,
  );
