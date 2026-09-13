import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";
import { can } from "@invessiv/common/patterns/auth/can";
import {
  WORKSPACE_AREA_PERMISSIONS,
  WORKSPACE_AREA_VALUES,
  type WorkspaceArea,
} from "@/common/constants/auth/workspace-areas";

export function listPermittedWorkspaceAreas(
  holder: PermissionHolder,
): WorkspaceArea[] {
  return WORKSPACE_AREA_VALUES.filter((area) =>
    can(holder, WORKSPACE_AREA_PERMISSIONS[area]),
  );
}
