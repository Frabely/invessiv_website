import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";

/** Status changes go through `ChangeTaskStatusRequestDto`, so completion data stays consistent. */
export interface UpdateTaskRequestDto {
  /** Replacement task name. Empty or whitespace-only values are rejected. */
  title: string;
  /** Replacement explanation; remains an empty string when no detail is needed. */
  description: string;
  /** Replacement for the side that has to act next. */
  actionSide: TaskActionSide;
  /** Must be true when `actionSide` is `customer`; otherwise the request is rejected. */
  visibleToCustomer: boolean;
  /** Must be an active member when it differs from the current assignee. */
  assigneeMemberId: string;
  /** Replacement due day as `YYYY-MM-DD`, or null to remove the deadline. */
  dueOn: string | null;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
