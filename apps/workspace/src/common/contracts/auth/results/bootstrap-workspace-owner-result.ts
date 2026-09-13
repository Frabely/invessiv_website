import type { BootstrapWorkspaceOwnerError } from "@/common/constants/auth/workspace-auth-statuses";

export type BootstrapWorkspaceOwnerResult =
  | { ok: true; userId: string; workspaceMemberId: string }
  | { ok: false; code: BootstrapWorkspaceOwnerError };
