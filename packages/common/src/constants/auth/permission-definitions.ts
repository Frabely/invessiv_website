import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import type { PermissionDefinition } from "@invessiv/common/contracts/auth/permission-definition";

const NOT_SCOPE_ASSIGNABLE: readonly AccessScopeType[] = [];
const CUSTOMER_ONLY: readonly AccessScopeType[] = [AccessScopeType.Customer];
const CUSTOMER_AND_PROJECT: readonly AccessScopeType[] = [
  AccessScopeType.Customer,
  AccessScopeType.Project,
];

/**
 * Single source of truth for the permission catalog. The migration mirrors every entry into
 * `permissions`; `db:smoke:rbac` fails as soon as code and database diverge.
 */
export const PERMISSION_DEFINITIONS = {
  [Permission.DashboardRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "View the workspace dashboard.",
  },
  [Permission.LeadsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "View leads and their history.",
  },
  [Permission.LeadsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Create, edit and archive leads.",
  },
  [Permission.LeadsDelete]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Permanently delete leads.",
  },
  [Permission.LeadsImport]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Import leads from CSV files.",
  },
  [Permission.OutreachGenerate]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Generate outreach message drafts.",
  },
  [Permission.MembersRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "List workspace members, e.g. to pick an owner.",
  },
  [Permission.CustomersRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_ONLY,
    description: "View customers and contacts.",
  },
  [Permission.CustomersWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_ONLY,
    description: "Create, edit, archive and reassign customers.",
  },
  [Permission.ProjectsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "View projects and tasks.",
  },
  [Permission.ProjectsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Create, edit and reassign projects.",
  },
  [Permission.ProjectLineItemsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "View the services assigned to a project.",
  },
  [Permission.ProjectLineItemsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Assign and edit the services of a project.",
  },
  [Permission.LineItemTemplatesRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "View the line item template catalog.",
  },
  [Permission.LineItemTemplatesWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Create, edit and archive line item templates.",
  },
  [Permission.TasksRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "View the tasks of a project.",
  },
  [Permission.TasksWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Create, edit and reassign tasks.",
  },
  [Permission.FilesRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "View and download customer files.",
  },
  [Permission.FilesWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Upload files and change their portal visibility.",
  },
  [Permission.FilesDelete]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Delete customer files.",
  },
  [Permission.CredentialsRead]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "View credential metadata without secret values.",
  },
  [Permission.CredentialsReveal]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Reveal and copy a single credential secret.",
  },
  [Permission.CredentialsWrite]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_AND_PROJECT,
    description: "Create, change and delete credentials.",
  },
  [Permission.PortalAccessManage]: {
    realm: AuthRealm.Workspace,
    delegable: true,
    scopeAssignable: true,
    assignableScopeTypes: CUSTOMER_ONLY,
    description: "Invite and revoke customer portal access.",
  },
  [Permission.RolesManage]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Create and change roles.",
  },
  [Permission.MembersManage]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Add, deactivate and assign roles to members.",
  },
  [Permission.DataExport]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Export customer data.",
  },
  [Permission.DataPurge]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Irreversibly purge a customer.",
  },
  [Permission.SecurityAudit]: {
    realm: AuthRealm.Workspace,
    delegable: false,
    scopeAssignable: false,
    assignableScopeTypes: NOT_SCOPE_ASSIGNABLE,
    description: "Read the security event log.",
  },
} as const satisfies Record<Permission, PermissionDefinition>;

export const WORKSPACE_PERMISSION_VALUES: readonly Permission[] =
  PERMISSION_VALUES.filter(
    (permission) =>
      PERMISSION_DEFINITIONS[permission].realm === AuthRealm.Workspace,
  );
