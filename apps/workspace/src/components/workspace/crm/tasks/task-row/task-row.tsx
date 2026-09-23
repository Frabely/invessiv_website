"use client";

import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { ButtonControl } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import { TaskActionSideBadge } from "../task-action-side-badge/task-action-side-badge";
import { TaskDueLabel } from "../task-due-label/task-due-label";
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
          <span className={styles.statusText}>{content.status[status]}</span>
        )}
      </div>
      <div className={styles.body}>
        {canWrite ? (
          <ButtonControl
            aria-label={formatMessage(content.row.editNamed, {
              name: task.title,
            })}
            className={styles.title}
            onClick={() => onEditAction(task)}
            type="button"
            variant="ghost"
          >
            {task.title}
          </ButtonControl>
        ) : (
          <span className={styles.title}>{task.title}</span>
        )}
        {task.description ? (
          <p className={styles.description}>{task.description}</p>
        ) : null}
        <div className={styles.meta}>
          <TaskActionSideBadge actionSide={task.actionSide} content={content} />
          {task.visibleToCustomer ? (
            <span className={styles.visibility}>
              <FontAwesomeIcon aria-hidden="true" icon={faEye} />
              {content.visibility.visible}
            </span>
          ) : null}
          <TaskDueLabel
            content={content}
            locale={locale}
            task={{ dueOn: task.dueOn, status }}
            today={today}
          />
          {assigneeName ? (
            <span className={styles.assignee}>
              {formatMessage(content.row.assignee, { name: assigneeName })}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
