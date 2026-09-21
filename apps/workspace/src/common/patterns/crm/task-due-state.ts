import { BUSINESS_TIME_ZONE } from "@invessiv/common/constants/crm/business-time-zone";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { OPEN_TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";
import {
  TASK_DUE_SOON_WINDOW_DAYS,
  TaskDueState,
} from "@/common/constants/crm/task-due-states";

const MILLISECONDS_PER_DAY = 86_400_000;

// `en-CA` formats a date as YYYY-MM-DD, which sorts and compares as plain text.
const BUSINESS_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function isStillOpen(status: TaskStatus): boolean {
  return (OPEN_TASK_STATUS_VALUES as readonly TaskStatus[]).includes(status);
}

function toUtcDay(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

/** The calendar day of `now` in the business time zone, as `YYYY-MM-DD`. */
function businessToday(now: Date = new Date()): string {
  return BUSINESS_DATE_FORMAT.format(now);
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
 * The single definition of "overdue" and "due soon" for cockpit, table and dashboard. Only tasks
 * that still demand action can be either; the SQL filters of the list queries mirror it.
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

export const taskDueStateService = {
  businessToday,
  addDays,
  daysBetween,
  dueState,
} as const;
