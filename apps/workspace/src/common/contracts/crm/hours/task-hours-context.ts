import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import type { CrmHoursTaskDictionary } from "./crm-hours-task-dictionary";

/** Optional hours display and booking action for project task rows. */
export type TaskHoursContext = {
  bookedMinutesByTaskId: Readonly<Record<string, number>>;
  content: CrmHoursTaskDictionary;
  onBookTimeAction?: (task: TaskDto) => void;
};
