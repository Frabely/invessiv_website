import "server-only";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import type { PortalPermissionTarget } from "./portal-permission-target";

/**
 * Portal permissions are customer-wide until project-bound roles are introduced. The target is
 * still explicit so that adding project grants later does not require changing every caller.
 */
function forActor(
  actor: PortalActor,
  permission: Permission,
  target: PortalPermissionTarget,
): boolean {
  if (target.customerId !== actor.customerId) return false;
  if (can(actor, permission)) return true;
  return (
    target.projectId !== undefined &&
    actor.projectPermissions.get(target.projectId)?.has(permission) === true
  );
}

/** Read checks; an owner view is bound to its one customer and has no project grants. */
function forReader(
  reader: PortalReader,
  permission: Permission,
  target: PortalPermissionTarget,
): boolean {
  if (!isPortalOwnerView(reader)) return forActor(reader, permission, target);
  return target.customerId === reader.customerId && can(reader, permission);
}

export const portalCanOn = { forActor, forReader } as const;
