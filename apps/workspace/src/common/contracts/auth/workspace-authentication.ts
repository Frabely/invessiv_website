import type { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export type WorkspaceAuthentication =
  | { status: typeof WorkspaceAuthStatus.Authorized; actor: WorkspaceActor }
  | { status: typeof WorkspaceAuthStatus.Unauthenticated }
  | { status: typeof WorkspaceAuthStatus.NotMember }
  | { status: typeof WorkspaceAuthStatus.Unavailable };
