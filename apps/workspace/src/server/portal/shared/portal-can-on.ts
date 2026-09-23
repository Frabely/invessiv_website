import "server-only";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
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

export const portalCanOn = { forActor } as const;
