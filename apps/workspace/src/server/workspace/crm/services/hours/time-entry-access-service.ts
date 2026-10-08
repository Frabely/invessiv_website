import "server-only";

import { and, eq, ne } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TimeEntryRow } from "@invessiv/common/contracts/crm/rows/time-entry-row";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { projectTimeEntries, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/** A project binding reaches only the entries of its own project, never those of a sibling. */
function condition(actor: WorkspaceActor, permission: Permission) {
  return crmAccessCondition.forScope(accessScope(actor, permission), {
    customerId: projectTimeEntries.customer_id,
    projectId: projectTimeEntries.project_id,
  });
}

/** The entry as it stands, without a lock. Null outside the actor's scope. */
async function find(
  reader: ContactDatabaseReader,
  id: string,
  actor: WorkspaceActor,
  permission: Permission,
): Promise<TimeEntryRow | null> {
  const [row] = await reader
    .select()
    .from(projectTimeEntries)
    .where(and(eq(projectTimeEntries.id, id), condition(actor, permission)))
    .limit(1);
  return row ?? null;
}

/** The entry locked for a delete. Null outside the actor's scope. */
async function lock(
  tx: ContactDatabaseTransaction,
  id: string,
  actor: WorkspaceActor,
  permission: Permission,
): Promise<TimeEntryRow | null> {
  const [row] = await tx
    .select()
    .from(projectTimeEntries)
    .where(and(eq(projectTimeEntries.id, id), condition(actor, permission)))
    .limit(1)
    .for("update");
  if (
    !row ||
    !canOn(actor, permission, {
      customerId: row.customer_id,
      projectId: row.project_id,
    })
  )
    return null;
  return row;
}

/**
 * A task can be named on an entry when it belongs to the entry's project and is not cancelled.
 * The database enforces the project; the status is a rule of the moment of linking only — a task
 * cancelled later keeps the entries that already name it.
 */
async function isTaskLinkable(
  reader: ContactDatabaseReader,
  taskId: string,
  projectId: string,
): Promise<boolean> {
  const [task] = await reader
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.project_id, projectId),
        ne(tasks.status, TaskStatus.Cancelled),
      ),
    )
    .limit(1);
  return !!task;
}

export const timeEntryAccessService = {
  condition,
  find,
  lock,
  isTaskLinkable,
} as const;
