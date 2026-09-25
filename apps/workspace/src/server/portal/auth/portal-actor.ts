import "server-only";

import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";
import type { Permission } from "@invessiv/common/constants/auth/permissions";

const portalActorBrand: unique symbol = Symbol("PortalActor");

/** A verified portal identity, constructible only by the portal authorization boundary. */
export interface PortalActor extends PermissionHolder {
  readonly [portalActorBrand]: true;
  readonly userId: string;
  readonly membershipId: string;
  readonly customerId: string;
  readonly personId: string;
  readonly projectPermissions: ReadonlyMap<string, ReadonlySet<Permission>>;
}

type PortalActorFields = Omit<PortalActor, typeof portalActorBrand>;

/** Creates an actor only after the resolver has verified the membership and its permissions. */
export function createPortalActor(fields: PortalActorFields): PortalActor {
  return { ...fields, [portalActorBrand]: true };
}
