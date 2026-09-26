import "server-only";

import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";

const portalOwnerViewBrand: unique symbol = Symbol("PortalOwnerView");

/**
 * A workspace owner looking at one customer's portal. Carries only portal read permissions and no
 * membership, so every write path — which demands a `PortalActor` — stays closed by type.
 */
export interface PortalOwnerView extends PermissionHolder {
  readonly [portalOwnerViewBrand]: true;
  /** The owner's `users.id`; security events reference it. */
  readonly userId: string;
  readonly customerId: string;
}

type PortalOwnerViewFields = Omit<PortalOwnerView, typeof portalOwnerViewBrand>;

/** Only the owner-view resolver calls this, after it verified the owner role and the customer. */
export function createPortalOwnerView(
  fields: PortalOwnerViewFields,
): PortalOwnerView {
  return { ...fields, [portalOwnerViewBrand]: true };
}

export function isPortalOwnerView(value: object): value is PortalOwnerView {
  return portalOwnerViewBrand in value;
}
