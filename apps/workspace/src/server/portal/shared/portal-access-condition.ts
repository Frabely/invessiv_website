import "server-only";

import { eq, sql, type SQL } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalCanOn } from "./portal-can-on";

import type { PortalAccessColumns } from "./portal-access-condition-types";

/**
 * Narrows every portal query to the actor's verified customer. A missing permission deliberately
 * produces a deny-all SQL condition instead of relying on callers to branch correctly.
 */
function forActor(
  actor: PortalActor,
  permission: Permission,
  columns: PortalAccessColumns,
): SQL {
  if (
    !portalCanOn.forActor(actor, permission, { customerId: actor.customerId })
  )
    return sql`FALSE`;
  return eq(columns.customerId, actor.customerId);
}

export const portalAccessCondition = { forActor } as const;
