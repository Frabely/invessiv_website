import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  TASK_ACTIVITY_ENTITY,
  TaskActivityField,
} from "@/common/constants/crm/task-activity-metadata";
import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { activityService } from "@/server/shared/services/activity-service";

type TaskActivitySubject = {
  customerId: string;
  projectId: string;
  taskId: string;
};

type TaskTrackedFields = {
  assigneeMemberId: string;
  actionSide: TaskActionSide;
  visibleToCustomer: boolean;
};

/**
 * Activities carry the ids and the changed values, never the title or description: the timeline
 * resolves the task by id and the free text must not be copied into an append-only log.
 */
function baseInput(subject: TaskActivitySubject, actor: WorkspaceActor) {
  return {
    customerId: subject.customerId,
    projectId: subject.projectId,
    actor: { type: ActorType.User, userId: actor.userId },
  } as const;
}

async function recordCreated(
  tx: ContactDatabaseTransaction,
  subject: TaskActivitySubject,
  actor: WorkspaceActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    ...baseInput(subject, actor),
    type: ActivityType.Created,
    metadata: { entity: TASK_ACTIVITY_ENTITY, task_id: subject.taskId },
  });
}

async function recordStatusChange(
  tx: ContactDatabaseTransaction,
  subject: TaskActivitySubject,
  actor: WorkspaceActor,
  change: { previous: TaskStatus; next: TaskStatus },
): Promise<void> {
  await activityService.createActivity(tx, {
    ...baseInput(subject, actor),
    type: ActivityType.StatusChange,
    body: `${change.previous} → ${change.next}`,
    metadata: {
      entity: TASK_ACTIVITY_ENTITY,
      task_id: subject.taskId,
      previous_status: change.previous,
      next_status: change.next,
    },
  });
}

/** One activity per changed tracked field; an edit that touches none writes none. */
async function recordFieldChanges(
  tx: ContactDatabaseTransaction,
  subject: TaskActivitySubject,
  actor: WorkspaceActor,
  change: { previous: TaskTrackedFields; next: TaskTrackedFields },
): Promise<void> {
  const fields = [
    [
      TaskActivityField.Assignee,
      change.previous.assigneeMemberId,
      change.next.assigneeMemberId,
    ],
    [
      TaskActivityField.ActionSide,
      change.previous.actionSide,
      change.next.actionSide,
    ],
    [
      TaskActivityField.VisibleToCustomer,
      change.previous.visibleToCustomer,
      change.next.visibleToCustomer,
    ],
  ] as const;

  for (const [field, previous, next] of fields) {
    if (previous === next) continue;
    await activityService.createActivity(tx, {
      ...baseInput(subject, actor),
      type: ActivityType.FieldChange,
      metadata: {
        entity: TASK_ACTIVITY_ENTITY,
        task_id: subject.taskId,
        field,
        previous,
        next,
      },
    });
  }
}

export const taskActivityService = {
  recordCreated,
  recordStatusChange,
  recordFieldChanges,
} as const;
