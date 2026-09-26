"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { TaskRowDetails } from "../task-row-details/task-row-details";
import { TaskStatusSelect } from "../task-status-select/task-status-select";
import styles from "./task-row.module.css";

type TaskRowProps = {
  /** Null when the actor may not list members; the assignee is then left out of the row. */
  assigneeName: string | null;
  canWrite: boolean;
  content: CrmTasksDictionary;
  locale: Locale;
  onEditAction: (task: TaskDto) => void;
  onStatusChangeAction: (task: TaskDto, status: TaskStatus) => void;
  pending: boolean;
  /** The status to show; differs from `task.status` while an optimistic change is in flight. */
  status: TaskStatus;
  task: TaskDto;
  today: string;
};

/** A task row keeps the status control separate from its edit target. */
export function TaskRow({
  assigneeName,
  canWrite,
  content,
  locale,
  onEditAction,
  onStatusChangeAction,
  pending,
  status,
  task,
  today,
}: TaskRowProps) {
  const dueState = taskDueStateService.dueState(
    { dueOn: task.dueOn, status },
    today,
  );
  const details = (
    <TaskRowDetails
      assigneeName={assigneeName}
      content={content}
      locale={locale}
      status={status}
      task={task}
      today={today}
    />
  );

  return (
    <li
      className={styles.row}
      data-due={dueState}
      data-pending={pending ? "true" : "false"}
      data-status={status}
    >
      <div className={styles.status}>
        {canWrite ? (
          <TaskStatusSelect
            content={content}
            disabled={pending}
            onChangeAction={(next) => onStatusChangeAction(task, next)}
            status={status}
            taskTitle={task.title}
          />
        ) : (
          <span className={styles.statusSymbol} data-status={status}>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={TASK_STATUS_ICONS[status]}
            />
            {content.status[status]}
          </span>
        )}
      </div>
      {canWrite ? (
        <button
          aria-label={formatMessage(content.row.editNamed, {
            name: task.title,
          })}
          className={styles.details}
          onClick={() => onEditAction(task)}
          type="button"
        >
          {details}
        </button>
      ) : (
        <div className={styles.details}>{details}</div>
      )}
    </li>
  );
}
