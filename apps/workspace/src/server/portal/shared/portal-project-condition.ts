import "server-only";

import { and, inArray, type SQL } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import { projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "./portal-access-condition";

/**
 * The single definition of "a project of the reader's company that the portal shows at all".
 * Archived and cancelled projects stay internal together with everything hanging on them.
 */
export function portalProjectCondition(
  reader: PortalReader,
  permission: Permission,
): SQL {
  return and(
    portalAccessCondition.forReader(reader, permission, {
      customerId: projects.customer_id,
    }),
    inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
  )!;
}
