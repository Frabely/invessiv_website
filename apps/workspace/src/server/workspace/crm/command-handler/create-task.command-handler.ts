import "server-only";

import { eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { CreateTaskRequestDto } from "@invessiv/common/contracts/crm/create-task-request.dto";
import type { CreateTaskResult } from "@invessiv/common/contracts/crm/results/create-task-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { taskActivityService } from "@/server/workspace/crm/services/task-activity-service";
import { taskAssigneeService } from "@/server/workspace/crm/services/task-assignee-service";
import { taskSchemas } from "@/server/workspace/crm/services/task-schemas";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";

/**
 * The customer is read from the project rather than taken from the request, so a task can never
 * be attached to a customer the caller addressed themselves. A project the actor may not write
 * answers like a missing one. Without an explicit assignee the project owner takes the task.
 */
export async function createTask(
  projectId: string,
  input: CreateTaskRequestDto,
  actor: WorkspaceActor,
): Promise<CreateTaskResult> {
  if (!taskSchemas.entityId.safeParse(projectId).success) {
    return { ok: false, code: TaskErrorCode.ProjectNotFound };
  }

  const validation = taskSchemas.create.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: TaskErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [project] = await db
    .select({
      customerId: projects.customer_id,
      ownerMemberId: projects.owner_member_id,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (
    !project ||
    !canOn(actor, Permission.TasksWrite, {
      customerId: project.customerId,
      projectId,
    })
  ) {
    return { ok: false, code: TaskErrorCode.ProjectNotFound };
  }

  const data = validation.data;
  const assigneeMemberId = data.assigneeMemberId ?? project.ownerMemberId;

  return db.transaction(async (tx): Promise<CreateTaskResult> => {
    if (!(await taskAssigneeService.isActiveMember(tx, assigneeMemberId))) {
      return { ok: false, code: TaskErrorCode.AssigneeNotActive };
    }

    const [row] = await tx
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        project_id: projectId,
        title: data.title,
        description: data.description,
        status: TaskStatus.Open,
        action_side: data.actionSide,
        visible_to_customer: data.visibleToCustomer,
        assignee_member_id: assigneeMemberId,
        due_on: data.dueOn,
        completed_at: null,
        completed_by_member_id: null,
        version: 1,
      })
      .returning();

    await taskActivityService.recordCreated(
      tx,
      { customerId: project.customerId, projectId, taskId: row.id },
      actor,
    );

    return { ok: true, task: tasksMapperService.toDto(row) };
  });
}
