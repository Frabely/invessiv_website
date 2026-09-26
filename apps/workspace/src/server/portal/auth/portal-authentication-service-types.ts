import type { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import type { PortalActor } from "./portal-actor";
import type { PortalReader } from "./portal-reader";

export type PortalAuthentication =
  | { status: typeof PortalAuthStatus.Authorized; actor: PortalActor }
  | { status: typeof PortalAuthStatus.Unauthenticated }
  | { status: typeof PortalAuthStatus.NotMember }
  | { status: typeof PortalAuthStatus.Unavailable };

export type PortalReaderAuthentication =
  | { status: typeof PortalAuthStatus.Authorized; reader: PortalReader }
  | { status: typeof PortalAuthStatus.Unauthenticated }
  | { status: typeof PortalAuthStatus.NotMember }
  | { status: typeof PortalAuthStatus.Unavailable };
