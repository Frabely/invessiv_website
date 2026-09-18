import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { WorkspaceAuthentication } from "@/common/contracts/auth/workspace-authentication";

export const TEST_ACTOR_USER_ID = "user-actor-uuid";

export function workspaceActorWith(
  permissions: readonly Permission[] = PERMISSION_VALUES,
): WorkspaceActor {
  return {
    userId: TEST_ACTOR_USER_ID,
    workspaceMemberId: "member-actor-uuid",
    permissions: new Set(permissions),
    customerPermissions: new Map(),
    projectPermissions: new Map(),
  };
}

export function authorizedWorkspaceRequest(
  permissions?: readonly Permission[],
): WorkspaceAuthentication {
  return {
    status: WorkspaceAuthStatus.Authorized,
    actor: workspaceActorWith(permissions),
  };
}

export function unauthenticatedWorkspaceRequest(): WorkspaceAuthentication {
  return { status: WorkspaceAuthStatus.Unauthenticated };
}

export function notMemberWorkspaceRequest(): WorkspaceAuthentication {
  return { status: WorkspaceAuthStatus.NotMember };
}

export function unavailableWorkspaceRequest(): WorkspaceAuthentication {
  return { status: WorkspaceAuthStatus.Unavailable };
}
