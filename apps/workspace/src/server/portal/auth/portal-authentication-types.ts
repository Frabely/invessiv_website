import type { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import type { PortalActor } from "./portal-actor";

export type PortalAuthentication =
  | { status: typeof PortalAuthStatus.Authorized; actor: PortalActor }
  | { status: typeof PortalAuthStatus.Unauthenticated }
  | { status: typeof PortalAuthStatus.NotMember }
  | { status: typeof PortalAuthStatus.Unavailable };
