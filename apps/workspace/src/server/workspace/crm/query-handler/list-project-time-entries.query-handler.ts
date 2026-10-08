import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { TimeEntryListLimits } from "@invessiv/common/constants/crm/time-entry-list-limits";
import type { TimeEntryPageDto } from "@invessiv/common/contracts/crm/hours/time-entry-page.dto";
import {
  decodeTimeEntryCursor,
  encodeTimeEntryCursor,
} from "@invessiv/common/patterns/crm/hours/time-entry-cursor";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  projects,
  projectTimeEntries,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { timeEntryAccessService } from "@/server/workspace/crm/services/hours/time-entry-access-service";

/** Postgres keeps microseconds, the cursor travels as a JS timestamp: both sides compare in milliseconds. */
const bookedAt = sql`date_trunc('milliseconds', ${projectTimeEntries.created_at})`;

/**
 * One page of a project's time entries, newest first, paged by keyset so that an entry booked or
 * deleted in between neither repeats nor swallows a neighbour — also among entries of one day.
 * `not_found` is a project outside the actor's read scope, `validation` an unreadable cursor.
 */
export async function listProjectTimeEntries(
  projectId: string,
  query: { cursor?: string | null },
  actor: WorkspaceActor,
): Promise<
  | { ok: true; page: TimeEntryPageDto }
  | {
      ok: false;
      code:
        | typeof HoursErrorCode.ProjectNotFound
        | typeof HoursErrorCode.ValidationError;
    }
> {
  if (!hoursSchemas.entityId.safeParse(projectId).success) {
    return { ok: false, code: HoursErrorCode.ProjectNotFound };
  }
  const cursor = query.cursor ? decodeTimeEntryCursor(query.cursor) : null;
  if (query.cursor && !cursor) {
    return { ok: false, code: HoursErrorCode.ValidationError };
  }

  const db = getDrizzleDatabaseClient();
  const [project] = await db
    .select({ customerId: projects.customer_id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (
    !project ||
    !canOn(actor, Permission.HoursRead, {
      customerId: project.customerId,
      projectId,
    })
  ) {
    return { ok: false, code: HoursErrorCode.ProjectNotFound };
  }

  const rows = await db
    .select()
    .from(projectTimeEntries)
    .where(
      and(
        eq(projectTimeEntries.project_id, projectId),
        timeEntryAccessService.condition(actor, Permission.HoursRead),
        cursor
          ? sql`(${projectTimeEntries.performed_on}, ${bookedAt}, ${projectTimeEntries.id}) < (${cursor.performedOn}::date, ${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
          : undefined,
      ),
    )
    .orderBy(
      desc(projectTimeEntries.performed_on),
      desc(bookedAt),
      desc(projectTimeEntries.id),
    )
    // One row beyond the page tells whether an older entry exists.
    .limit(TimeEntryListLimits.PageSize + 1);

  const entries = rows
    .slice(0, TimeEntryListLimits.PageSize)
    .map(hoursMappingService.toTimeEntryDto);
  const last = entries.at(-1);
  return {
    ok: true,
    page: {
      entries,
      nextCursor:
        rows.length > TimeEntryListLimits.PageSize && last
          ? encodeTimeEntryCursor({
              performedOn: last.performedOn,
              createdAt: last.createdAt,
              id: last.id,
            })
          : null,
    },
  };
}
