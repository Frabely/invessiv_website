import { faLayerGroup, faListCheck } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Badge } from "@invessiv/ui";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import styles from "./task-status-badge.module.css";
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
  ...TASK_STATUS_ICONS,
};

export function TaskStatusBadge({
  className,
  label,
  status,
}: TaskStatusBadgeProps) {
  return (
    <Badge
      className={className ? `${styles.badge} ${className}` : styles.badge}
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={TASK_STATUS_BADGE_TONES[status]}
    />
  );
}
