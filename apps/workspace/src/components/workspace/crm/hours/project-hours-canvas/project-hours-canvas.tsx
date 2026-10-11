"use client";

import type { ReactNode } from "react";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import type { TaskHoursContext } from "@/common/contracts/crm/hours/task-hours-context";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
import { projectHoursCanvasContext } from "@/common/patterns/crm/hours/project-hours-canvas-context";
import type { Locale } from "@/config/i18n";
import { useProjectHoursCanvas } from "@/hooks/workspace/crm/use-project-hours-canvas";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProjectHoursSection } from "../project-hours-section/project-hours-section";
import { TimeEntryFormDialog } from "../time-entry-form-dialog/time-entry-form-dialog";

export type ProjectHoursCanvasProps = {
  content?: CrmHoursDictionary;
  customerId: string;
  hours?: HoursViewModel;
  locale: Locale;
  projectId: string;
  tasks?: TasksViewModel;
  renderTasksAction: (hours: TaskHoursContext | undefined) => ReactNode;
};

/** Binds task shortcuts and the hours section to the same booking form. */
export function ProjectHoursCanvas({
  content,
  customerId,
  hours,
  locale,
  projectId,
  tasks,
  renderTasksAction,
}: ProjectHoursCanvasProps) {
  const canvas = useProjectHoursCanvas();
  const context = projectHoursCanvasContext(projectId, hours, tasks);
  if (!context || !content) return renderTasksAction(undefined);

  const taskHours: TaskHoursContext = {
    bookedMinutesByTaskId: context.bookedMinutesByTaskId,
    content: content.task,
    onBookTimeAction: context.canBook
      ? (task) => canvas.open(null, task.id)
      : undefined,
  };
  return (
    <>
      {renderTasksAction(taskHours)}
      <ProjectHoursSection
        canManage={context.canManage}
        canWrite={context.canWrite}
        content={content}
        customerId={customerId}
        freeMinutes={context.freeMinutes}
        locale={locale}
        onBookAction={() => canvas.open(null)}
        onChangedAction={canvas.changed}
        onEditAction={(entry) => canvas.open(entry)}
        project={context.project}
        revision={canvas.revision}
        tasks={context.tasks}
      />
      {canvas.dialog ? (
        <TimeEntryFormDialog
          content={content}
          entry={canvas.dialog.entry}
          initialTaskId={canvas.dialog.taskId}
          locale={locale}
          onCloseAction={canvas.close}
          onSavedAction={canvas.changed}
          project={context.project}
          projectTitle={context.project.title}
          tasks={context.tasks}
          today={context.today}
        />
      ) : null}
    </>
  );
}
