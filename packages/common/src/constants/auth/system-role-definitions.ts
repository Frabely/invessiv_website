import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  PORTAL_PERMISSION_VALUES,
  WORKSPACE_PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { SystemRoleDefinition } from "@invessiv/common/contracts/auth/system-role-definition";

export const SYSTEM_ROLE_DEFINITIONS = {
  [SystemRoleKey.WorkspaceOwner]: {
    id: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01",
    realm: AuthRealm.Workspace,
    name: "Workspace owner",
    // Derived, not listed: a new workspace permission must never be missing from the owner.
    permissions: WORKSPACE_PERMISSION_VALUES,
  },
  [SystemRoleKey.WorkspaceMember]: {
    id: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02",
    realm: AuthRealm.Workspace,
    name: "Workspace member",
    permissions: [
      Permission.DashboardRead,
      Permission.LeadsRead,
      Permission.LeadsWrite,
      Permission.LeadsImport,
      Permission.OutreachGenerate,
      Permission.MembersRead,
      Permission.CustomersRead,
      Permission.CustomersWrite,
      Permission.ProjectsRead,
      Permission.ProjectsWrite,
      Permission.ProjectLineItemsRead,
      Permission.ProjectLineItemsWrite,
      Permission.LineItemTemplatesRead,
      Permission.LineItemTemplatesWrite,
      Permission.TasksRead,
      Permission.TasksWrite,
      Permission.FilesRead,
      Permission.FilesWrite,
      Permission.CredentialsRead,
    ],
  },
  [SystemRoleKey.WorkspaceCredentialsManager]: {
    id: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a03",
    realm: AuthRealm.Workspace,
    name: "Workspace credentials manager",
    permissions: [Permission.CredentialsReveal],
  },
  [SystemRoleKey.PortalStandard]: {
    id: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04",
    realm: AuthRealm.Portal,
    name: "Portal standard",
    // Derived, not listed: a new portal permission must never be missing from the default role.
    permissions: PORTAL_PERMISSION_VALUES,
  },
} as const satisfies Record<SystemRoleKey, SystemRoleDefinition>;
