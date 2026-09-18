import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export type PermissionTarget = { customerId: string; projectId?: string };

export function canOn(
  actor: WorkspaceActor,
  permission: Permission,
  target: PermissionTarget,
): boolean {
  if (can(actor, permission)) return true;
  if (actor.customerPermissions.get(target.customerId)?.has(permission))
    return true;
  return (
    target.projectId !== undefined &&
    actor.projectPermissions.get(target.projectId)?.customerId ===
      target.customerId &&
    actor.projectPermissions
      .get(target.projectId)
      ?.permissions.has(permission) === true
  );
}
