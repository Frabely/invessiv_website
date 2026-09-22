import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";

/**
 * Keyed by the status filter, which contains every task status under the same value; a task's own
 * status therefore looks up its tone here as well, so a status has one color everywhere.
 */
export const TASK_STATUS_BADGE_TONES = {
  [TaskListStatusFilter.All]: BadgeTone.Neutral,
  [TaskListStatusFilter.Active]: BadgeTone.Primary,
  [TaskListStatusFilter.Open]: BadgeTone.Info,
  [TaskListStatusFilter.InProgress]: BadgeTone.Warning,
  [TaskListStatusFilter.Done]: BadgeTone.Success,
  [TaskListStatusFilter.Cancelled]: BadgeTone.Neutral,
} as const satisfies Record<TaskListStatusFilter, BadgeToneValue>;
