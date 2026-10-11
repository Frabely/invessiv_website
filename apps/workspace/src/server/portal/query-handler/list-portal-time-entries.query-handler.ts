import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TimeEntryListLimits } from "@invessiv/common/constants/crm/time-entry-list-limits";
import { PortalHoursErrorCode } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import type { PortalTimeEntryListQueryDto } from "@invessiv/common/contracts/portal/portal-time-entry-list-query.dto";
import type { ListPortalTimeEntriesResult } from "@invessiv/common/contracts/portal/results/list-portal-time-entries-result";
import { decodeTimeEntryCursor } from "@invessiv/common/patterns/crm/hours/time-entry-cursor";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectTimeEntries, tasks } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalHoursMappingService } from "@/server/portal/services/hours/portal-hours-mapping-service";
import { portalHoursService } from "@/server/portal/services/hours/portal-hours-service";
import { timeEntryPageService } from "@/server/shared/services/hours/time-entry-page-service";

const projectIdSchema = z.uuid();

/**
 * One page of the company's time entries, newest first. Every entry is listed, also those of
 * projects the portal hides; they lose their project reference instead. A project filter must
 * name a project the portal shows, so a foreign or archived id is `validation`, never an empty
 * page that would confirm it exists.
 */
export async function listPortalTimeEntries(
  reader: PortalReader,
  query: PortalTimeEntryListQueryDto,
): Promise<ListPortalTimeEntriesResult> {
  if (!portalHoursService.can(reader, Permission.PortalHoursEntriesRead))
    return { ok: false, code: PortalHoursErrorCode.NotFound };

  const cursor = query.cursor ? decodeTimeEntryCursor(query.cursor) : null;
  if (query.cursor && !cursor)
    return { ok: false, code: PortalHoursErrorCode.Validation };
  if (query.projectId && !projectIdSchema.safeParse(query.projectId).success)
    return { ok: false, code: PortalHoursErrorCode.Validation };

  const visibleProjectIds = await portalHoursService.visibleProjectIds(
    reader,
    Permission.PortalHoursEntriesRead,
  );
  if (query.projectId && !visibleProjectIds.has(query.projectId))
    return { ok: false, code: PortalHoursErrorCode.Validation };

  const rows = await getDrizzleDatabaseClient()
    .select({
      id: projectTimeEntries.id,
      project_id: projectTimeEntries.project_id,
      performed_on: projectTimeEntries.performed_on,
      duration_minutes: projectTimeEntries.duration_minutes,
      description: projectTimeEntries.description,
      billable: projectTimeEntries.billable,
      created_at: projectTimeEntries.created_at,
      task_title: tasks.title,
      task_visible_to_customer: tasks.visible_to_customer,
    })
    .from(projectTimeEntries)
    .leftJoin(tasks, eq(tasks.id, projectTimeEntries.task_id))
    .where(
      and(
        portalHoursService.condition(
          reader,
          Permission.PortalHoursEntriesRead,
          { customerId: projectTimeEntries.customer_id },
        ),
        query.projectId
          ? eq(projectTimeEntries.project_id, query.projectId)
          : undefined,
        timeEntryPageService.after(cursor),
      ),
    )
    .orderBy(...timeEntryPageService.newestFirst)
    // One row beyond the page tells whether an older entry exists.
    .limit(TimeEntryListLimits.PageSize + 1);

  const view = {
    visibleProjectIds,
    showTaskTitles: portalHoursService.can(reader, Permission.PortalTasksRead),
  };
  return {
    ok: true,
    page: {
      entries: rows
        .slice(0, TimeEntryListLimits.PageSize)
        .map((row) => portalHoursMappingService.toTimeEntryDto(row, view)),
      nextCursor: timeEntryPageService.nextCursor(
        rows,
        TimeEntryListLimits.PageSize,
      ),
    },
  };
}
