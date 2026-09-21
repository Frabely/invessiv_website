import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";

/** Status changes go through `ChangeTaskStatusRequestDto`, so completion data stays consistent. */
export interface UpdateTaskRequestDto {
  title: string;
  description: string;
  actionSide: TaskActionSide;
  /** Must be true when `actionSide` is `customer`; otherwise the request is rejected. */
  visibleToCustomer: boolean;
  /** Must be an active member when it differs from the current assignee. */
  assigneeMemberId: string;
  dueOn: string | null;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
