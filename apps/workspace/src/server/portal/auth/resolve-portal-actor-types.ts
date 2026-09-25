import type { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import type { PortalActor } from "./portal-actor";

export type ResolvePortalActorResult =
  | { ok: true; actor: PortalActor }
  | { ok: false; code: PortalActorResolutionError };
