import "server-only";

import { eq, sql, type SQL } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCanOn } from "./portal-can-on";

import type { PortalAccessColumns } from "./portal-access-condition-types";

/**
 * Narrows every portal query to the reader's verified customer. A missing permission deliberately
 * produces a deny-all SQL condition instead of relying on callers to branch correctly.
 */
function forReader(
  reader: PortalReader,
  permission: Permission,
  columns: PortalAccessColumns,
): SQL {
  if (
    !portalCanOn.forReader(reader, permission, {
      customerId: reader.customerId,
    })
  )
    return sql`FALSE`;
  return eq(columns.customerId, reader.customerId);
}

function forActor(
  actor: PortalActor,
  permission: Permission,
  columns: PortalAccessColumns,
): SQL {
  return forReader(actor, permission, columns);
}

export const portalAccessCondition = { forActor, forReader } as const;
