import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircle,
  faCircleCheck,
  faCirclePlay,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";

export const TASK_STATUS_ICONS = {
  open: faCircle,
  in_progress: faCirclePlay,
  done: faCircleCheck,
  cancelled: faCircleXmark,
} as const satisfies Record<TaskStatus, IconDefinition>;
