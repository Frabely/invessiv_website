import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActorRow } from "@invessiv/common/contracts/auth/rows/workspace-actor-row";
import { isPermission } from "@invessiv/common/patterns/auth/can";
import { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import type { ResolveWorkspaceActorResult } from "@/server/workspace/auth/resolve-workspace-actor-types";

// Unknown keys and permissions of another realm are dropped instead of trusted.
function isWorkspacePermission(key: string | null): key is Permission {
  return (
    key !== null &&
    isPermission(key) &&
    PERMISSION_DEFINITIONS[key].realm === AuthRealm.Workspace
  );
}

function mapRowsToResolution(
  rows: WorkspaceActorRow[],
): ResolveWorkspaceActorResult {
  const [first] = rows;

  if (!first) {
    return { ok: false, code: WorkspaceActorResolutionError.UserMissing };
  }
  if (!first.user_active) {
    return { ok: false, code: WorkspaceActorResolutionError.UserInactive };
  }
  if (first.workspace_member_id === null) {
    return {
      ok: false,
      code: WorkspaceActorResolutionError.MembershipMissing,
    };
  }
  if (first.member_active !== true) {
    return {
      ok: false,
      code: WorkspaceActorResolutionError.MembershipInactive,
    };
  }

  return {
    ok: true,
    actor: {
      userId: first.user_id,
      workspaceMemberId: first.workspace_member_id,
      permissions: new Set(
        rows.map((row) => row.permission_key).filter(isWorkspacePermission),
      ),
    },
  };
}

export const workspaceActorMappingService = {
  mapRowsToResolution,
} as const;
