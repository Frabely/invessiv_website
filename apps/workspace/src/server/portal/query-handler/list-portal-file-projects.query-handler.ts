import "server-only";
import { and, desc, inArray } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";

/** Projects an upload may be assigned to; empty without `portal.projects.read`. */
export async function listPortalFileProjects(
  reader: PortalReader,
): Promise<PortalFileProjectOptionDto[]> {
  return getDrizzleDatabaseClient()
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(
      and(
        portalAccessCondition.forReader(reader, Permission.PortalProjectsRead, {
          customerId: projects.customer_id,
        }),
        inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
      ),
    )
    .orderBy(desc(projects.created_at));
}
