import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";

/**
 * Whether the portal shows this project at all. A released entry on an archived or cancelled
 * project stays invisible to the customer, so the release is refused instead of silently doing
 * nothing.
 */
async function isProjectPortalVisible(
  tx: ContactDatabaseTransaction,
  projectId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
      ),
    )
    .limit(1)
    .for("share");
  return !!row;
}

export const credentialPortalProjectService = {
  isProjectPortalVisible,
} as const;
