import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";

/** Waiting on the customer is the state worth noticing, so it carries the warm tone. */
export const TASK_ACTION_SIDE_BADGE_TONES = {
  [TaskActionSide.Internal]: BadgeTone.Teal,
  [TaskActionSide.Customer]: BadgeTone.Warning,
} as const satisfies Record<TaskActionSide, BadgeToneValue>;
