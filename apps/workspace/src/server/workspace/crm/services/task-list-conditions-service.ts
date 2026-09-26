import "server-only";

import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  notInArray,
  type SQL,
} from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  OPEN_TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { customers, projects, tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { TASK_LIST_ASSIGNEE_ME } from "@/common/constants/crm/list/task-list-assignee";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import { TASK_DUE_SOON_WINDOW_DAYS } from "@invessiv/common/constants/crm/task-due-states";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

const CLOSED_PROJECT_STATUSES = [
  ProjectStatus.Completed,
  ProjectStatus.Cancelled,
  ProjectStatus.Archived,
] as const;

/** Escapes the two wildcard characters, so a typed `%` or `_` searches for itself. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function statusCondition(status: TaskListStatusFilter): SQL | undefined {
  switch (status) {
    case TaskListStatusFilter.All:
      return undefined;
    case TaskListStatusFilter.Active:
      return inArray(tasks.status, [...OPEN_TASK_STATUS_VALUES]);
    case TaskListStatusFilter.Open:
      return eq(tasks.status, TaskStatus.Open);
    case TaskListStatusFilter.InProgress:
      return eq(tasks.status, TaskStatus.InProgress);
    case TaskListStatusFilter.Done:
      return eq(tasks.status, TaskStatus.Done);
    case TaskListStatusFilter.Cancelled:
      return eq(tasks.status, TaskStatus.Cancelled);
  }
}

/**
 * The SQL twin of `taskDueStateService.dueState`: a due day only counts while the task still
 * demands action, and "today" is decided once by the caller in the business time zone.
 */
function periodCondition(
  period: TaskListPeriod,
  today: string,
): SQL | undefined {
  if (period === TaskListPeriod.All) return undefined;

  const stillOpen = inArray(tasks.status, [...OPEN_TASK_STATUS_VALUES]);
  const weekEnd = taskDueStateService.addDays(today, TASK_DUE_SOON_WINDOW_DAYS);
  switch (period) {
    case TaskListPeriod.Overdue:
      return and(stillOpen, lt(tasks.due_on, today));
    case TaskListPeriod.Today:
      return and(stillOpen, eq(tasks.due_on, today));
    case TaskListPeriod.Week:
      return and(
        stillOpen,
        gte(tasks.due_on, today),
        lte(tasks.due_on, weekEnd),
      );
    case TaskListPeriod.DueSoon:
      return and(stillOpen, lte(tasks.due_on, weekEnd));
  }
}

/**
 * Everything a task list narrows by, in one place. The access scope comes first and can never be
 * widened by a filter, so the same actor always sees the same tasks for the same filters, however
 * many queries build on it.
 */
function build(
  filters: TaskListFilters,
  actor: WorkspaceActor,
  today: string,
): SQL | undefined {
  return and(
    crmAccessCondition.forScope(accessScope(actor, Permission.TasksRead), {
      customerId: projects.customer_id,
      projectId: projects.id,
    }),
    statusCondition(filters.status),
    periodCondition(filters.period, today),
    filters.actionSide ? eq(tasks.action_side, filters.actionSide) : undefined,
    filters.assignee
      ? eq(
          tasks.assignee_member_id,
          filters.assignee === TASK_LIST_ASSIGNEE_ME
            ? actor.workspaceMemberId
            : filters.assignee,
        )
      : undefined,
    filters.customerId
      ? eq(projects.customer_id, filters.customerId)
      : undefined,
    filters.projectId ? eq(tasks.project_id, filters.projectId) : undefined,
    filters.search
      ? ilike(tasks.title, `%${escapeLikePattern(filters.search)}%`)
      : undefined,
    filters.includeClosedProjects
      ? undefined
      : and(
          notInArray(projects.status, [...CLOSED_PROJECT_STATUSES]),
          notInArray(customers.status, [CustomerStatus.Archived]),
        ),
  );
}

export const taskListConditionsService = { build } as const;
