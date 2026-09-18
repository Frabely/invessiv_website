import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { AccessScopeKind } from "@invessiv/common/constants/auth/access-scope-types";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export type AccessScope =
  | { kind: typeof AccessScopeKind.All }
  | {
      kind: typeof AccessScopeKind.Limited;
      customerIds: ReadonlySet<string>;
      projectIds: ReadonlySet<string>;
      /** Customers reachable only through a project binding; visible as a container, never as a customer-wide grant. */
      projectCustomerIds: ReadonlySet<string>;
    };

export function canAnywhere(
  actor: WorkspaceActor,
  permission: Permission,
): boolean {
  return (
    can(actor, permission) ||
    [...actor.customerPermissions.values()].some((permissions) =>
      permissions.has(permission),
    ) ||
    [...actor.projectPermissions.values()].some((scope) =>
      scope.permissions.has(permission),
    )
  );
}

export function accessScope(
  actor: WorkspaceActor,
  permission: Permission,
): AccessScope {
  if (can(actor, permission)) return { kind: AccessScopeKind.All };
  const customerIds = new Set(
    [...actor.customerPermissions].flatMap(([customerId, permissions]) =>
      permissions.has(permission) ? [customerId] : [],
    ),
  );
  const projectBindings = [...actor.projectPermissions].filter(
    ([, scope]) =>
      scope.permissions.has(permission) && !customerIds.has(scope.customerId),
  );
  const projectIds = new Set(projectBindings.map(([projectId]) => projectId));
  const projectCustomerIds = new Set(
    projectBindings.map(([, scope]) => scope.customerId),
  );
  return {
    kind: AccessScopeKind.Limited,
    customerIds,
    projectIds,
    projectCustomerIds,
  };
}
