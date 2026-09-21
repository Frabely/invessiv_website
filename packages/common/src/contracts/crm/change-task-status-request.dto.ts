import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";

export interface ChangeTaskStatusRequestDto {
  /** Any status may follow any other, including reopening a done or cancelled task. */
  status: TaskStatus;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
