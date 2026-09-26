import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import {
  OPEN_TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import type { CompleteCustomerTaskResult } from "@invessiv/common/contracts/portal/results/complete-customer-task-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import { TASK_ACTIVITY_ENTITY } from "@/common/constants/crm/task-activity-metadata";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { activityService } from "@/server/shared/services/activity-service";

const taskIdSchema = z.uuid();

const NOT_FOUND = {
  ok: false,
  code: PortalTaskErrorCode.NotFound,
} as const satisfies CompleteCustomerTaskResult;

/**
 * Marks a released customer-side task of the actor's company as done. Every miss — foreign
 * company, internal or hidden task, archived project, missing permission — answers the same
 * `not_found`, so a guessed id confirms nothing.
 *
 * Deliberately not `updateVersioned`: completing is idempotent and has no concurrent edit to
 * lose, so the client's version is not required. The row is locked and the UPDATE repeats every
 * visibility condition, so the write stays atomic without a version check.
 */
export async function completeCustomerTask(
  actor: PortalActor,
  taskId: string,
): Promise<CompleteCustomerTaskResult> {
  if (!taskIdSchema.safeParse(taskId).success) return NOT_FOUND;

  const db = getDrizzleDatabaseClient();
  const releasedToActor = and(
    eq(tasks.id, taskId),
    eq(tasks.action_side, TaskActionSide.Customer),
    eq(tasks.visible_to_customer, true),
    inArray(
      tasks.project_id,
      db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.customer_id, actor.customerId),
            inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
          ),
        ),
    ),
  );

  return db.transaction(async (tx): Promise<CompleteCustomerTaskResult> => {
    const [target] = await tx
      .select({ projectId: tasks.project_id, status: tasks.status })
      .from(tasks)
      .where(releasedToActor)
      .limit(1)
      .for("update");

    const permissionTarget = {
      customerId: actor.customerId,
      projectId: target?.projectId,
    };
    if (
      !target ||
      target.status === TaskStatus.Cancelled ||
      !portalCanOn.forActor(
        actor,
        Permission.PortalTasksRead,
        permissionTarget,
      ) ||
      !portalCanOn.forActor(
        actor,
        Permission.PortalTasksComplete,
        permissionTarget,
      )
    ) {
      return NOT_FOUND;
    }
    if (target.status === TaskStatus.Done)
      return { ok: true, alreadyDone: true };

    const now = new Date();
    const updated = await tx
      .update(tasks)
      .set({
        status: TaskStatus.Done,
        completed_at: now,
        completed_by_member_id: null,
        completed_by_portal_membership_id: actor.membershipId,
        version: sql`${tasks.version}
                + 1`,
        updated_at: now,
      })
      .where(
        and(releasedToActor, inArray(tasks.status, OPEN_TASK_STATUS_VALUES)),
      )
      .returning({ id: tasks.id });
    if (updated.length !== 1) return NOT_FOUND;

    await activityService.createActivity(tx, {
      customerId: actor.customerId,
      projectId: target.projectId,
      actor: { type: ActorType.Customer, userId: actor.userId },
      type: ActivityType.StatusChange,
      body: `${target.status} → ${TaskStatus.Done}`,
      metadata: {
        entity: TASK_ACTIVITY_ENTITY,
        task_id: taskId,
        previous_status: target.status,
        next_status: TaskStatus.Done,
      },
      occurredAt: now,
    });

    return { ok: true, alreadyDone: false };
  });
}
