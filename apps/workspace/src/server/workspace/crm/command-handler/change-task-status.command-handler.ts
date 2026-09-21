import "server-only";

import { eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ChangeTaskStatusRequestDto } from "@invessiv/common/contracts/crm/change-task-status-request.dto";
import type { ChangeTaskStatusResult } from "@invessiv/common/contracts/crm/results/change-task-status-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { taskActivityService } from "@/server/workspace/crm/services/task-activity-service";
import { taskSchemas } from "@/server/workspace/crm/services/task-schemas";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Any status may follow any other, so a done or cancelled task can be reopened. Completion data
 * is derived here — set when the task becomes `done`, cleared on any other status — which is the
 * only place that writes it. Asking for the status a task already has changes nothing and is not
 * logged.
 */
export async function changeTaskStatus(
  taskId: string,
  input: ChangeTaskStatusRequestDto,
  actor: WorkspaceActor,
): Promise<ChangeTaskStatusResult> {
  if (!taskSchemas.entityId.safeParse(taskId).success) {
    return { ok: false, code: TaskErrorCode.TaskNotFound };
  }

  const validation = taskSchemas.changeStatus.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: TaskErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [target] = await db
    .select({ task: tasks, customerId: projects.customer_id })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.project_id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (
    !target ||
    !canOn(actor, Permission.TasksWrite, {
      customerId: target.customerId,
      projectId: target.task.project_id,
    })
  ) {
    return { ok: false, code: TaskErrorCode.TaskNotFound };
  }

  const data = validation.data;
  if (target.task.status === data.status) {
    return { ok: true, task: tasksMapperService.toDto(target.task) };
  }

  const becomesDone = data.status === TaskStatus.Done;

  return db.transaction(async (tx): Promise<ChangeTaskStatusResult> => {
    const write = await updateVersioned({
      tx,
      table: tasks,
      id: taskId,
      expectedVersion: data.version,
      patch: {
        status: data.status,
        completed_at: becomesDone ? new Date() : null,
        completed_by_member_id: becomesDone ? actor.workspaceMemberId : null,
      },
      toDto: tasksMapperService.toDto,
    });

    if (!write.ok) {
      if (write.code === ConcurrencyErrorCode.NotFound) {
        return { ok: false, code: TaskErrorCode.TaskNotFound };
      }
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: write.conflict,
      };
    }

    await taskActivityService.recordStatusChange(
      tx,
      {
        customerId: target.customerId,
        projectId: target.task.project_id,
        taskId,
      },
      actor,
      { previous: target.task.status, next: data.status },
    );

    return { ok: true, task: write.value };
  });
}
