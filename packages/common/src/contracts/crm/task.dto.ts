import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";

/**
 * A task that belongs to exactly one project. The customer is derived from the project and is
 * deliberately not a field here.
 */
export interface TaskDto {
  id: string;
  /** The one project this task belongs to. There is no customer-level or free-floating task. */
  projectId: string;
  title: string;
  /** Longer explanation; empty string, never null, when nothing was filled in. */
  description: string;
  /** `open` and `in_progress` still demand action; `done` and `cancelled` are closed. */
  status: TaskStatus;
  /** Who has to act next: the internal team or the customer. */
  actionSide: TaskActionSide;
  /** Whether the customer sees this task in the portal. Always true while `actionSide` is `customer`. */
  visibleToCustomer: boolean;
  /** The internal workspace member who is responsible, also while the customer has to act. */
  assigneeMemberId: string;
  /** Due day as `YYYY-MM-DD` in the business time zone, or null when the task has no deadline. */
  dueOn: string | null;
  /** When the task was completed; set exactly while `status` is `done`, otherwise null. */
  completedAt: string | null;
  /** The member who completed the task; set exactly while `status` is `done`, otherwise null. */
  completedByMemberId: string | null;
  /** Optimistic-concurrency counter; every update request must echo the value it read. */
  version: number;
  createdAt: string;
  updatedAt: string;
}
