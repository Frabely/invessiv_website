import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { OPEN_TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";
import {
  TASK_DUE_SOON_WINDOW_DAYS,
  TaskDueState,
} from "@invessiv/common/constants/crm/task-due-states";
import type { TaskSummary } from "@/common/contracts/crm/task-summary";
import { businessToday } from "@/common/patterns/time/business-today";

const MILLISECONDS_PER_DAY = 86_400_000;

function isStillOpen(status: TaskStatus): boolean {
  return (OPEN_TASK_STATUS_VALUES as readonly TaskStatus[]).includes(status);
}

function toUtcDay(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

function addDays(isoDate: string, days: number): string {
  return new Date(toUtcDay(isoDate) + days * MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Whole days between two `YYYY-MM-DD` dates; positive when `laterDate` is after `earlierDate`. */
function daysBetween(earlierDate: string, laterDate: string): number {
  return Math.round(
    (toUtcDay(laterDate) - toUtcDay(earlierDate)) / MILLISECONDS_PER_DAY,
  );
}

/**
 * The single definition of "overdue" and "due soon". Only tasks that still demand action can be
 * either; the SQL filters of the list queries mirror it, so anything that shows or filters by
 * due state has to go through here.
 */
function dueState(
  task: { status: TaskStatus; dueOn: string | null },
  today: string,
): TaskDueState {
  if (task.dueOn === null || !isStillOpen(task.status)) {
    return TaskDueState.None;
  }
  if (task.dueOn < today) {
    return TaskDueState.Overdue;
  }
  if (task.dueOn <= addDays(today, TASK_DUE_SOON_WINDOW_DAYS)) {
    return TaskDueState.DueSoon;
  }
  return TaskDueState.None;
}

function summarize(
  tasks: readonly { status: TaskStatus; dueOn: string | null }[],
  today: string,
): TaskSummary {
  let open = 0;
  let overdue = 0;
  for (const task of tasks) {
    if (!isStillOpen(task.status)) continue;
    open += 1;
    if (dueState(task, today) === TaskDueState.Overdue) overdue += 1;
  }
  return { open, overdue };
}

export const taskDueStateService = {
  isStillOpen,
  businessToday,
  addDays,
  daysBetween,
  dueState,
  summarize,
} as const;
