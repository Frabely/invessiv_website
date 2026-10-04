import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { ReopenCustomerTaskResult } from "@invessiv/common/contracts/portal/results/reopen-customer-task-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMemberships, tasks } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalCustomerTaskCondition } from "@/server/portal/shared/portal-customer-task-condition";
import { taskActivityService } from "@/server/shared/services/task-activity-service";

const taskIdSchema = z.uuid();

const NOT_FOUND = {
  ok: false,
  code: PortalTaskErrorCode.NotFound,
} as const satisfies ReopenCustomerTaskResult;

/**
 * Takes back a completion a contact of the actor's company made in the portal. A task the team
 * completed stays done: it answers the same `not_found` as a foreign, internal or hidden task, so
 * the portal can never undo internal work and a guessed id confirms nothing.
 *
 * Deliberately not `updateVersioned`, like the completion: reopening is idempotent, the row is
 * locked and the UPDATE repeats every condition, including the portal origin.
 */
export async function reopenCustomerTask(
  actor: PortalActor,
  taskId: string,
): Promise<ReopenCustomerTaskResult> {
  if (!taskIdSchema.safeParse(taskId).success) return NOT_FOUND;
  const db = getDrizzleDatabaseClient();
  const releasedToActor = portalCustomerTaskCondition(
    actor,
    taskId,
    Permission.PortalTasksReopen,
  );

  return db.transaction(async (tx): Promise<ReopenCustomerTaskResult> => {
    const [target] = await tx
      .select({ projectId: tasks.project_id, status: tasks.status })
      .from(tasks)
      .where(releasedToActor)
      .limit(1)
      .for("update");

    if (
      !target ||
      target.status === TaskStatus.Cancelled ||
      !portalCanOn.forActor(actor, Permission.PortalTasksReopen, {
        customerId: actor.customerId,
        projectId: target.projectId,
      })
    ) {
      return NOT_FOUND;
    }
    if (target.status !== TaskStatus.Done)
      return { ok: true, alreadyOpen: true };

    const updated = await tx
      .update(tasks)
      .set({
        status: TaskStatus.Open,
        completed_at: null,
        completed_by_member_id: null,
        completed_by_portal_membership_id: null,
        version: sql`${tasks.version} + 1`,
        updated_at: new Date(),
      })
      .where(
        and(
          releasedToActor,
          eq(tasks.status, TaskStatus.Done),
          inArray(
            tasks.completed_by_portal_membership_id,
            tx
              .select({ id: portalMemberships.id })
              .from(portalMemberships)
              .where(eq(portalMemberships.customer_id, actor.customerId)),
          ),
        ),
      )
      .returning({ id: tasks.id });
    if (updated.length !== 1) return NOT_FOUND;

    await taskActivityService.recordStatusChange(
      tx,
      {
        customerId: actor.customerId,
        projectId: target.projectId,
        taskId,
      },
      portalActivityActor(actor),
      { previous: TaskStatus.Done, next: TaskStatus.Open },
    );

    return { ok: true, alreadyOpen: false };
  });
}
