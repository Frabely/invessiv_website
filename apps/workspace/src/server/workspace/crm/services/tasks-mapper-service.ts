import type { TaskRow } from "@invessiv/common/contracts/crm/rows/task-row";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

function toDto(row: TaskRow): TaskDto {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    actionSide: row.action_side,
    visibleToCustomer: row.visible_to_customer,
    assigneeMemberId: row.assignee_member_id,
    dueOn: row.due_on,
    completedAt: row.completed_at?.toISOString() ?? null,
    completedByMemberId: row.completed_by_member_id,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const tasksMapperService = { toDto } as const;
