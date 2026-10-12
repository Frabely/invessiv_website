import { randomUUID } from "node:crypto";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import type { PortalE2eSeed } from "@/test/contracts/portal-e2e-seed";
export async function insertTasks(
  tx: ContactDatabaseTransaction,
  seed: PortalE2eSeed,
) {
  const { managerMemberId, taskProject, customerTaskId } = seed;
  await tx.insert(tasks).values([
    {
      id: customerTaskId,
      project_id: taskProject,
      title: "E2E customer task",
      description: "Customer completion and reopening flow",
      status: TaskStatus.Open,
      action_side: TaskActionSide.Customer,
      visible_to_customer: true,
      assignee_member_id: managerMemberId,
      version: 1,
    },
    {
      id: randomUUID(),
      project_id: taskProject,
      title: "E2E team-completed task",
      description: "The customer must not reopen this completion",
      status: TaskStatus.Done,
      action_side: TaskActionSide.Customer,
      visible_to_customer: true,
      assignee_member_id: managerMemberId,
      completed_at: new Date(),
      completed_by_member_id: managerMemberId,
      version: 1,
    },
  ]);
}
