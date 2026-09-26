"use client";

import { useId, useState } from "react";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { PrimaryCtaButton } from "@invessiv/ui";
import type { TaskAssigneeOption } from "@/common/contracts/crm/tasks-view-model";
import type { Locale } from "@/config/i18n";
import { useTaskStatusChange } from "@/hooks/workspace/use-task-status-change";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import { SectionCollapseToggle } from "@/components/workspace/crm/shared/section-collapse-toggle/section-collapse-toggle";
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
}: ProjectTasksSectionProps) {
  const statusChange = useTaskStatusChange(content);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const bodyId = useId();

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

  function renderRow(task: TaskDto) {
    return (
      <TaskRow
        assigneeName={memberNames.get(task.assigneeMemberId) ?? null}
        canWrite={canWrite}
        content={content}
        key={task.id}
        locale={locale}
        onEditAction={openDialog}
        onStatusChangeAction={statusChange.changeStatus}
        pending={statusChange.isPending(task.id)}
        status={statusChange.statusOf(task)}
        task={task}
        today={today}
      />
    );
  }

  return (
    <section
      aria-labelledby={`project-tasks-${projectId}`}
      className={styles.tasks}
    >
      <header className={styles.head}>
        <h3 id={`project-tasks-${projectId}`}>{content.section.title}</h3>
        <div className={styles.headMeta}>
          {tasks.length > 0 ? (
            <span className={styles.count}>
              {openTasks.length > 0
                ? formatMessage(content.section.count, {
                    count: String(openTasks.length),
                  })
                : content.section.countNone}
            </span>
          ) : null}
          {canWrite ? (
            <PrimaryCtaButton
              className={styles.actionButton}
              onClick={() => openDialog(null)}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faClipboardList} />
              {content.section.addAction}
            </PrimaryCtaButton>
          ) : null}
          <SectionCollapseToggle
            controls={bodyId}
            expanded={expanded}
            labelCollapse={content.section.collapseLabel}
            labelExpand={content.section.expandLabel}
            onToggleAction={() => setExpanded((current) => !current)}
          />
        </div>
      </header>

      {expanded ? (
        <div className={styles.body} id={bodyId}>
          {tasks.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                {canWrite ? content.empty.title : content.emptyReadOnly.title}
              </p>
              <p className={styles.emptyText}>
                {canWrite
                  ? content.empty.description
                  : content.emptyReadOnly.description}
              </p>
            </div>
          ) : (
            <>
              {openTasks.length > 0 ? (
                <ul
                  aria-label={content.section.ariaLabel}
                  className={styles.list}
                >
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
        </div>
      ) : null}

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
    </section>
  );
}
