import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import type { ProjectHoursCanvasContext } from "@/common/contracts/crm/hours/project-hours-canvas-context";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
import { projectHoursActions } from "./project-hours-actions";

export function projectHoursCanvasContext(
  projectId: string,
  hours: HoursViewModel | undefined,
  tasks: TasksViewModel | undefined,
): ProjectHoursCanvasContext | null {
  if (!hours) return null;
  const project = hours.hours.projects.find(
    (row) => row.projectId === projectId,
  );
  if (!project) return null;
  const canWrite = hours.writableProjectIds.includes(projectId);
  const freeMinutes = hours.hours.balance?.freeMinutes ?? null;
  const actions = projectHoursActions({
    project,
    canWrite,
    canManage: hours.canManage,
    freeMinutes,
  });
  const canReadTasks = tasks?.readableProjectIds.includes(projectId) ?? false;
  return {
    project,
    canWrite,
    canBook: actions.canBook,
    canManage: hours.canManage,
    freeMinutes,
    tasks:
      canReadTasks && tasks
        ? tasks.tasks
            .filter((task) => task.projectId === projectId)
            .map((task) => ({
              id: task.id,
              title: task.title,
              linkable: task.status !== TaskStatus.Cancelled,
            }))
        : null,
    bookedMinutesByTaskId: hours.bookedMinutesByTaskId,
    today: hours.today,
  };
}
