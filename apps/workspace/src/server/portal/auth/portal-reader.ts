import type { PortalActor } from "./portal-actor";
import type { PortalOwnerView } from "./portal-owner-view";

/** Whoever may read a customer's portal: a verified contact, or the workspace owner in read-only view. */
export type PortalReader = PortalActor | PortalOwnerView;
