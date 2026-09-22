import {
  faCircle,
  faCircleCheck,
  faCirclePlay,
  faCircleXmark,
  faLayerGroup,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Badge } from "@invessiv/ui";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";

type TaskStatusBadgeProps = {
  className?: string;
  label: string;
  /** A task status or one of the extra filter values; both share one color per value. */
  status: TaskListStatusFilter;
};

const STATUS_ICONS: Record<TaskListStatusFilter, IconDefinition> = {
  [TaskListStatusFilter.All]: faLayerGroup,
  [TaskListStatusFilter.Active]: faListCheck,
  [TaskListStatusFilter.Open]: faCircle,
  [TaskListStatusFilter.InProgress]: faCirclePlay,
  [TaskListStatusFilter.Done]: faCircleCheck,
  [TaskListStatusFilter.Cancelled]: faCircleXmark,
};

export function TaskStatusBadge({
  className,
  label,
  status,
}: TaskStatusBadgeProps) {
  return (
    <Badge
      className={className}
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={TASK_STATUS_BADGE_TONES[status]}
    />
  );
}
