import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import {
  WORKSPACE_AREA_PERMISSIONS,
  WORKSPACE_AREA_VALUES,
  WorkspaceArea,
} from "@/common/constants/auth/workspace-areas";

export function listPermittedWorkspaceAreas(
  actor: WorkspaceActor,
): WorkspaceArea[] {
  return WORKSPACE_AREA_VALUES.filter((area) =>
    area === WorkspaceArea.Crm
      ? canAnywhere(actor, Permission.CustomersRead) ||
        canAnywhere(actor, Permission.ProjectsRead)
      : can(actor, WORKSPACE_AREA_PERMISSIONS[area]),
  );
}
