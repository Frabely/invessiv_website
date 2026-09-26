import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";

/** Direct mirror of the `tasks` row shape as Drizzle returns it. */
export interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  action_side: TaskActionSide;
  visible_to_customer: boolean;
  assignee_member_id: string;
  due_on: string | null;
  completed_at: Date | null;
  completed_by_member_id: string | null;
  completed_by_portal_membership_id: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}
