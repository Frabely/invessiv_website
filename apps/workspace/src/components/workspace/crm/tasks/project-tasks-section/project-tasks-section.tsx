"use client";

import { useState } from "react";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import type { TaskAssigneeOption } from "@/common/contracts/crm/tasks-view-model";
import type { TaskHoursContext } from "@/common/contracts/crm/hours/task-hours-context";
import type { Locale } from "@/config/i18n";
import { useTaskStatusChange } from "@/hooks/workspace/use-task-status-change";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import { TaskFormDialog } from "../task-form-dialog/task-form-dialog";
import { TaskRow } from "../task-row/task-row";
import styles from "./project-tasks-section.module.css";

type ProjectTasksSectionProps = {
  canWrite: boolean;
  content: CrmTasksDictionary;
  locale: Locale;
  members: readonly TaskAssigneeOption[];
  projectId: string;
  tasks: readonly TaskDto[];
  /** The current business day (`YYYY-MM-DD`), decided once on the server. */
  today: string;
  /**
   * Present only with the right to read hours on this project; without it the rows look exactly
   * as before. Booking is offered only when `onBookTimeAction` is passed as well.
   */
  hours?: TaskHoursContext;
};

/**
 * The tasks of one project: what is open comes first, who is up next and what is overdue reads at
 * a glance, and finished work folds away. The same dialog adds and edits; a status change happens
 * in the row and is announced to assistive technology.
 */
export function ProjectTasksSection({
  canWrite,
  content,
  locale,
  members,
  projectId,
  tasks,
  today,
  hours,
}: ProjectTasksSectionProps) {
  const statusChange = useTaskStatusChange(content);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  // The task that was just marked done here; booking time for it is offered once, never forced.
  const [justDoneTaskId, setJustDoneTaskId] = useState<string | null>(null);

  const isOpen = (task: TaskDto) =>
    taskDueStateService.isStillOpen(statusChange.statusOf(task));
  const openTasks = tasks.filter(isOpen);
  const closedTasks = tasks.filter((task) => !isOpen(task));
  const memberNames = new Map(
    members.map((member) => [member.id, member.displayName]),
  );

  function openDialog(task: TaskDto | null) {
    setEditing(task);
    setDialogOpen(true);
  }

  function changeStatus(task: TaskDto, status: TaskStatus) {
    setJustDoneTaskId(status === TaskStatus.Done ? task.id : null);
    statusChange.changeStatus(task, status);
  }

  function bookTime(task: TaskDto) {
    setJustDoneTaskId(null);
    hours?.onBookTimeAction?.(task);
  }

  // A change that failed rolls the status back; the offer then no longer applies.
  const justDoneTask =
    hours?.onBookTimeAction && justDoneTaskId
      ? (tasks.find(
          (task) =>
            task.id === justDoneTaskId &&
            statusChange.statusOf(task) === TaskStatus.Done,
        ) ?? null)
      : null;

  function renderRow(task: TaskDto) {
    const bookedMinutes = hours?.bookedMinutesByTaskId[task.id] ?? 0;
    return (
      <TaskRow
        assigneeName={memberNames.get(task.assigneeMemberId) ?? null}
        canWrite={canWrite}
        content={content}
        key={task.id}
        locale={locale}
        onEditAction={openDialog}
        bookedLabel={
          hours && bookedMinutes > 0
            ? formatMessage(hours.content.booked, {
                duration: formatDuration(bookedMinutes),
              })
            : undefined
        }
        bookTime={
          hours?.onBookTimeAction &&
          statusChange.statusOf(task) !== TaskStatus.Cancelled
            ? {
                label: hours.content.bookAction,
                namedLabel: formatMessage(hours.content.bookNamed, {
                  name: task.title,
                }),
                onAction: () => bookTime(task),
              }
            : undefined
        }
        onStatusChangeAction={changeStatus}
        pending={statusChange.isPending(task.id)}
        status={statusChange.statusOf(task)}
        task={task}
        today={today}
      />
    );
  }

  return (
    <CollapsibleSection
      action={
        canWrite ? (
          <PrimaryCtaButton
            className={styles.actionButton}
            onClick={() => openDialog(null)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faClipboardList} />
            {content.section.addAction}
          </PrimaryCtaButton>
        ) : null
      }
      after={
        <>
          <p aria-live="polite" className="sr-only" role="status">
            {statusChange.announcement}
          </p>
          {dialogOpen && canWrite ? (
            <TaskFormDialog
              content={content}
              key={editing?.id ?? "add"}
              members={members}
              onCloseAction={() => setDialogOpen(false)}
              projectId={projectId}
              task={editing}
            />
          ) : null}
        </>
      }
      count={
        tasks.length > 0
          ? openTasks.length > 0
            ? formatMessage(content.section.count, {
                count: String(openTasks.length),
              })
            : content.section.countNone
          : undefined
      }
      labelCollapse={content.section.collapseLabel}
      labelExpand={content.section.expandLabel}
      title={content.section.title}
    >
      {tasks.length === 0 ? (
        <SectionEmptyState
          description={
            canWrite
              ? content.empty.description
              : content.emptyReadOnly.description
          }
          title={canWrite ? content.empty.title : content.emptyReadOnly.title}
        />
      ) : (
        <>
          {justDoneTask && hours ? (
            <p className={styles.bookHint} role="status">
              <span>
                {formatMessage(hours.content.doneHint, {
                  name: justDoneTask.title,
                })}
              </span>
              <span className={styles.bookHintActions}>
                <ButtonControl
                  onClick={() => bookTime(justDoneTask)}
                  type="button"
                  variant="ghost"
                >
                  {hours.content.bookAction}
                </ButtonControl>
                <ButtonControl
                  onClick={() => setJustDoneTaskId(null)}
                  type="button"
                  variant="quiet"
                >
                  {hours.content.dismiss}
                </ButtonControl>
              </span>
            </p>
          ) : null}
          {openTasks.length > 0 ? (
            <ul aria-label={content.section.ariaLabel} className={styles.list}>
              {openTasks.map(renderRow)}
            </ul>
          ) : null}
          {closedTasks.length > 0 ? (
            <div className={styles.closed}>
              <button
                aria-expanded={showClosed}
                className={styles.toggle}
                onClick={() => setShowClosed((current) => !current)}
                type="button"
              >
                {showClosed
                  ? content.section.hideClosed
                  : closedTasks.length === 1
                    ? content.section.showClosedOne
                    : formatMessage(content.section.showClosed, {
                        count: String(closedTasks.length),
                      })}
              </button>
              {showClosed ? (
                <ul
                  aria-label={content.section.closedAriaLabel}
                  className={styles.list}
                >
                  {closedTasks.map(renderRow)}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  );
}
