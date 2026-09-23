import "server-only";

import { eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateTaskResult } from "@invessiv/common/contracts/crm/results/update-task-result";
import type { UpdateTaskRequestDto } from "@invessiv/common/contracts/crm/update-task-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { taskActivityService } from "@/server/workspace/crm/services/task-activity-service";
import { taskAssigneeService } from "@/server/workspace/crm/services/task-assignee-service";
import { taskSchemas } from "@/server/workspace/crm/services/task-schemas";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Edits the content, the assignee, the acting side and the visibility of a task. The status has
 * its own command so completion data can never drift from it. The write is scoped by the project
 * the task already belongs to and never moves a task to another project.
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateTaskResult> {
  // An id that is not a UUID at all can never match a row; treated the same as a missing one.
  if (!taskSchemas.entityId.safeParse(taskId).success) {
    return { ok: false, code: TaskErrorCode.TaskNotFound };
  }

  const validation = taskSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: TaskErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [target] = await db
    .select({
      customerId: projects.customer_id,
      projectId: tasks.project_id,
      assigneeMemberId: tasks.assignee_member_id,
      actionSide: tasks.action_side,
      visibleToCustomer: tasks.visible_to_customer,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.project_id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (
    !target ||
    !canOn(actor, Permission.TasksWrite, {
      customerId: target.customerId,
      projectId: target.projectId,
    })
  ) {
    return { ok: false, code: TaskErrorCode.TaskNotFound };
  }

  const data = validation.data;

  return db.transaction(async (tx): Promise<UpdateTaskResult> => {
    // Keeping the current assignee stays valid even after they were deactivated.
    if (
      data.assigneeMemberId !== target.assigneeMemberId &&
      !(await taskAssigneeService.isActiveMember(tx, data.assigneeMemberId))
    ) {
      return { ok: false, code: TaskErrorCode.AssigneeNotActive };
    }

    const write = await updateVersioned({
      tx,
      table: tasks,
      id: taskId,
      expectedVersion: data.version,
      patch: {
        title: data.title,
        description: data.description,
        action_side: data.actionSide,
        visible_to_customer: data.visibleToCustomer,
        assignee_member_id: data.assigneeMemberId,
        due_on: data.dueOn,
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

    // The version matched, so the row is exactly the one read above and the diff is accurate.
    await taskActivityService.recordFieldChanges(
      tx,
      {
        customerId: target.customerId,
        projectId: target.projectId,
        taskId,
      },
      actor,
      {
        previous: {
          assigneeMemberId: target.assigneeMemberId,
          actionSide: target.actionSide,
          visibleToCustomer: target.visibleToCustomer,
        },
        next: {
          assigneeMemberId: data.assigneeMemberId,
          actionSide: data.actionSide,
          visibleToCustomer: data.visibleToCustomer,
        },
      },
    );

    return { ok: true, task: write.value };
  });
}
