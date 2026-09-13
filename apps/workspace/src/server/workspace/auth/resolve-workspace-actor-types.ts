import type { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export type ResolveWorkspaceActorResult =
  | { ok: true; actor: WorkspaceActor }
  | { ok: false; code: WorkspaceActorResolutionError };
