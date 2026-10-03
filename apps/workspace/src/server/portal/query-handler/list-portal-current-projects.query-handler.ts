import "server-only";

import { desc, ne, and } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { comparePortalCurrentProjects } from "@/common/patterns/portal/compare-portal-current-projects";

export async function listPortalCurrentProjects(reader: PortalReader) {
  const rows = await getDrizzleDatabaseClient()
    .select({ id: projects.id, title: projects.title, status: projects.status })
    .from(projects)
    .where(
      and(
        portalProjectCondition(reader, Permission.PortalProjectsRead),
        ne(projects.status, ProjectStatus.Completed),
      ),
    )
    .orderBy(desc(projects.created_at));
  return rows
    .sort(comparePortalCurrentProjects)
    .map(({ id, title }) => ({ id, title }));
}
