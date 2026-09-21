import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";

/** The project comes from the route and the customer from the project; neither is part of the body. */
export interface CreateTaskRequestDto {
  title: string;
  /** Use an empty string when there is nothing to add. */
  description: string;
  actionSide: TaskActionSide;
  /** Must be true when `actionSide` is `customer`; otherwise the request is rejected. */
  visibleToCustomer: boolean;
  /** Null assigns the project owner. Any other member must be active. */
  assigneeMemberId: string | null;
  /** Due day as `YYYY-MM-DD`, or null for no deadline. */
  dueOn: string | null;
}
