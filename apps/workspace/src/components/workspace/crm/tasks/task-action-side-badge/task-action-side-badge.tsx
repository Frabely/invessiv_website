import { faHourglassHalf, faUser } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { Badge } from "@invessiv/ui";
import { TASK_ACTION_SIDE_BADGE_TONES } from "@/common/constants/crm/badges/task-action-side-badge-tones";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";

type TaskActionSideBadgeProps = {
  actionSide: TaskActionSide;
  content: CrmTasksDictionary;
};

const ACTION_SIDE_ICONS: Record<TaskActionSide, IconDefinition> = {
  [TaskActionSide.Internal]: faUser,
  [TaskActionSide.Customer]: faHourglassHalf,
};

/** Who has to act next. */
export function TaskActionSideBadge({
  actionSide,
  content,
}: TaskActionSideBadgeProps) {
  return (
    <Badge
      icon={ACTION_SIDE_ICONS[actionSide]}
      kind={actionSide}
      label={content.actionSide[actionSide]}
      tone={TASK_ACTION_SIDE_BADGE_TONES[actionSide]}
    />
  );
}
