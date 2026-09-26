import type { TaskDueState } from "../../constants/crm/task-due-states";

export interface PortalTaskDto {
  /** Task identifier; the completion command addresses this value. */
  id: string;
  /** Parent project identifier for project selection. */
  projectId: string;
  /** Parent project label, needed in the cross-project task list. */
  projectTitle: string;
  /** Customer-visible task title. */
  title: string;
  /** Customer-visible task detail; null when no detail was entered. */
  description: string | null;
  /** Calendar due date; null when no deadline was agreed. */
  dueOn: string | null;
  /** Display-only due state derived in the business time zone. */
  dueState: TaskDueState;
  /** Whether this task has been completed. */
  done: boolean;
  /** Completion timestamp; null while work remains open. */
  completedAt: string | null;
}
