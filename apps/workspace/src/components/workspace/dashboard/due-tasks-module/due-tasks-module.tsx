import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import { MY_DUE_TASK_LIST_FILTERS } from "@/common/defaults/crm/my-due-task-list-filters";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import type { Locale } from "@/config/i18n";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getDashboardDueTasksDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { crmTasksPathFor } from "@/lib/auth/routes";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { buildTaskListHref } from "@/lib/workspace/crm/task-list-query-string";
import { listMyDueTasks } from "@/server/workspace/crm/query-handler/list-my-due-tasks.query-handler";
import { DueTasksView } from "./due-tasks-view";

type DueTasksModuleProps = {
  actor: WorkspaceActor;
  locale: Locale;
};

async function readMyDueTasks(
  actor: WorkspaceActor,
  today: string,
): Promise<TaskListRowDto[]> {
  try {
    return await listMyDueTasks(actor, today);
  } catch (error) {
    // The block is optional; the rest of the dashboard must render even when tasks cannot load.
    console.error("[dashboard] due tasks could not be loaded", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return [];
  }
}

/** Renders nothing without a task grant, without due tasks, or when the read fails. */
export async function DueTasksModule({ actor, locale }: DueTasksModuleProps) {
  if (!canAnywhere(actor, Permission.TasksRead)) {
    return null;
  }

  const today = taskDueStateService.businessToday();
  const rows = await readMyDueTasks(actor, today);
  if (rows.length === 0) {
    return null;
  }

  return (
    <DueTasksView
      labels={getDashboardDueTasksDictionary(locale)}
      locale={locale}
      rows={rows}
      tasksContent={getCrmTasksDictionary(locale)}
      today={today}
      viewAllHref={buildTaskListHref(
        crmTasksPathFor(locale),
        MY_DUE_TASK_LIST_FILTERS,
      )}
    />
  );
}
