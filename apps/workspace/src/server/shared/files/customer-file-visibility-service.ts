import "server-only";
import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { files, projects } from "@invessiv/db/record-configuration";

function visibleProjectIds(customerId: string) {
  return getDrizzleDatabaseClient()
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.customer_id, customerId),
        inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
      ),
    );
}

/**
 * Entries the customer could open once released: finished, not orphaned, and company-wide or in a
 * project the portal shows. The portal adds the release flag and its permission filter; the CRM
 * uses it to refuse chat attachments the customer could never open.
 */
function openableCondition(customerId: string): SQL {
  return and(
    eq(files.customer_id, customerId),
    eq(files.status, FileStatus.Ready),
    isNull(files.orphaned_at),
    or(
      isNull(files.project_id),
      inArray(files.project_id, visibleProjectIds(customerId)),
    ),
  )!;
}

/**
 * True only if every id matches `condition`; one foreign, hidden or unknown id fails them all. The
 * matching rows stay share-locked, so a parallel change cannot slip in before the caller writes.
 */
async function allMatch(
  tx: ContactDatabaseTransaction,
  ids: readonly string[],
  condition: SQL,
): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await tx
    .select({ id: files.id })
    .from(files)
    .where(and(inArray(files.id, [...ids]), condition))
    .for("share");
  return rows.length === ids.length;
}

export const customerFileVisibilityService = { openableCondition, allMatch };
