import "server-only";

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectTimeEntries } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { timeEntryAccessService } from "@/server/workspace/crm/services/hours/time-entry-access-service";

/**
 * The time booked per task of one customer, in a single grouped query. Goodwill counts as well:
 * the figure says how long a task took, not what was charged. Tasks outside the actor's read
 * scope contribute nothing.
 */
export async function getTaskBookedMinutes(
  customerId: string,
  actor: WorkspaceActor,
): Promise<Record<string, number>> {
  if (!hoursSchemas.entityId.safeParse(customerId).success) return {};

  const rows = await getDrizzleDatabaseClient()
    .select({
      taskId: projectTimeEntries.task_id,
      minutes: sql<number>`sum(${projectTimeEntries.duration_minutes})`,
    })
    .from(projectTimeEntries)
    .where(
      and(
        eq(projectTimeEntries.customer_id, customerId),
        isNotNull(projectTimeEntries.task_id),
        timeEntryAccessService.condition(actor, Permission.HoursRead),
      ),
    )
    .groupBy(projectTimeEntries.task_id);

  const booked: Record<string, number> = {};
  for (const row of rows) {
    if (row.taskId) booked[row.taskId] = Number(row.minutes);
  }
  return booked;
}
