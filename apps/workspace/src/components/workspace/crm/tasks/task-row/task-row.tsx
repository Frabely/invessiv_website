"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { StatusRowTone } from "@/common/constants/ui/status-row-tones";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import { StatusRow } from "@/components/workspace/shared/status-row/status-row";
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

/** A task row keeps the status control separate from its edit target (layout: `StatusRow`). */
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
    <StatusRow
      detailsClassName={styles.details}
      onOpenAction={canWrite ? () => onEditAction(task) : undefined}
      openLabel={
        canWrite
          ? formatMessage(content.row.editNamed, { name: task.title })
          : undefined
      }
      pending={pending}
      status={
        canWrite ? (
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
        )
      }
      tone={
        dueState === TaskDueState.Overdue
          ? StatusRowTone.Attention
          : StatusRowTone.Default
      }
    >
      <TaskRowDetails
        assigneeName={assigneeName}
        content={content}
        locale={locale}
        status={status}
        task={task}
        today={today}
      />
    </StatusRow>
  );
}
