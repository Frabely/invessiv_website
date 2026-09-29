import "server-only";
import { desc } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";

/** Projects an upload may be assigned to; empty without `portal.projects.read`. */
export async function listPortalFileProjects(
  reader: PortalReader,
): Promise<PortalFileProjectOptionDto[]> {
  return getDrizzleDatabaseClient()
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(portalProjectCondition(reader, Permission.PortalProjectsRead))
    .orderBy(desc(projects.created_at));
}
