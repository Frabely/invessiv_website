"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
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
  const assigneeLabel = assigneeName
    ? formatMessage(content.row.assignee, { name: assigneeName })
    : null;
  const details = (
    <>
      <span className={styles.main}>
        <span className={styles.title}>{task.title}</span>
        {task.description ? (
          <span className={styles.description}>{task.description}</span>
        ) : null}
      </span>
      <span className={styles.meta}>
        <span className={styles.side}>
          <TaskActionSideBadge actionSide={task.actionSide} content={content} />
        </span>
        <span className={styles.visibility}>
          <FontAwesomeIcon
            aria-hidden="true"
            icon={task.visibleToCustomer ? faEye : faEyeSlash}
          />
          {task.visibleToCustomer
            ? content.visibility.visible
            : content.visibility.hidden}
        </span>
        {task.dueOn ? (
          <span className={styles.due}>
            <TaskDueLabel
              content={content}
              locale={locale}
              task={{ dueOn: task.dueOn, status }}
              today={today}
            />
          </span>
        ) : null}
        {assigneeName && assigneeLabel ? (
          <span className={styles.assignee}>
            <span aria-hidden="true" className={styles.initials}>
              {getMemberInitials(assigneeName)}
            </span>
            {assigneeLabel}
          </span>
        ) : null}
      </span>
    </>
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
