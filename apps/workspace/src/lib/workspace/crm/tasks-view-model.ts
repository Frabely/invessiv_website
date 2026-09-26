import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";
import { listCustomerTasks } from "@/server/workspace/crm/query-handler/list-customer-tasks.query-handler";

/**
 * Collects the tasks of a customer's projects together with the per-project rights, so the
 * cockpit can decide what to show without asking the server again when it switches projects.
 * Returns null when no project of this customer is readable — the area then stays hidden.
 */
export async function buildTasksViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
  projects: readonly CockpitProjectDto[];
}): Promise<TasksViewModel | null> {
  const { actor, customerId, projects } = options;
  const idsWith = (permission: Permission) =>
    projects
      .filter((project) =>
        canOn(actor, permission, { customerId, projectId: project.id }),
      )
      .map((project) => project.id);

  const readableProjectIds = idsWith(Permission.TasksRead);
  if (readableProjectIds.length === 0) return null;

  // Member names are only handed to actors who may list members; a task grant alone must not
  // disclose the team. Without them the rows simply omit the assignee.
  const [tasks, members] = await Promise.all([
    listCustomerTasks(customerId, actor),
    can(actor, Permission.MembersRead) ? listWorkspaceMembers() : [],
  ]);

  return {
    tasks,
    readableProjectIds,
    writableProjectIds: idsWith(Permission.TasksWrite),
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      active: member.active,
    })),
    today: taskDueStateService.businessToday(),
  };
}
