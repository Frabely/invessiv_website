import "server-only";

import type { SQL } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import type { PortalAccessColumns } from "@/server/portal/shared/portal-access-condition-types";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";

/** Company-wide check; hours rights are never bound to a single project. */
function can(reader: PortalReader, permission: Permission): boolean {
  return portalCanOn.forReader(reader, permission, {
    customerId: reader.customerId,
  });
}

/** Rows of the reader's own company; `FALSE` without the right, so a miss looks like no data. */
function condition(
  reader: PortalReader,
  permission: Permission,
  columns: PortalAccessColumns,
): SQL {
  return portalAccessCondition.forReader(reader, permission, columns);
}

/**
 * Projects of the reader's company the portal shows by name. Status only: deliberately not gated
 * by `portal.projects.read`, because a project title may serve as navigation for an area the
 * reader holds its own right for. `permission` is that right; without it the set is empty.
 */
async function visibleProjectIds(
  reader: PortalReader,
  permission: Permission,
): Promise<Set<string>> {
  const rows = await getDrizzleDatabaseClient()
    .select({ id: projects.id })
    .from(projects)
    .where(portalProjectCondition(reader, permission));
  return new Set(rows.map((row) => row.id));
}

/** The single definition of who reads which hours in the portal; no handler repeats these rules. */
export const portalHoursService = {
  can,
  condition,
  visibleProjectIds,
} as const;
