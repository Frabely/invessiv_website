"use client";

import Link from "next/link";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { DataTableCell, DataTableHeaderCell, DataTableRow } from "@invessiv/ui";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { TaskActionSideBadge } from "../../task-action-side-badge/task-action-side-badge";
import { TaskDueLabel } from "../../task-due-label/task-due-label";
import { TaskStatusBadge } from "../../task-status-badge/task-status-badge";
import { TaskStatusSelect } from "../../task-status-select/task-status-select";
import styles from "./task-overview-row.module.css";

type TaskOverviewRowProps = {
  /** Null when the actor may not list members. */
  assigneeName: string | null;
  canWrite: boolean;
  content: CrmTasksDictionary;
  /** Opens the customer file of this task's customer. */
  customerHref: string | null;
  locale: Locale;
  onStatusChangeAction: (row: TaskListRowDto, status: TaskStatus) => void;
  pending: boolean;
  row: TaskListRowDto;
  /** The status to show; differs from the stored one while a change is in flight. */
  status: TaskStatus;
  today: string;
};

export function TaskOverviewRow({
  assigneeName,
  canWrite,
  content,
  customerHref,
  locale,
  onStatusChangeAction,
  pending,
  row,
  status,
  today,
}: TaskOverviewRowProps) {
  const { task } = row;
  const overview = content.overview;

  return (
    <DataTableRow
      className={styles.row}
      data-pending={pending ? "true" : "false"}
    >
      <DataTableCell className={styles.dueCell}>
        <TaskDueLabel
          content={content}
          locale={locale}
          task={{ dueOn: task.dueOn, status }}
          today={today}
        />
      </DataTableCell>
      <DataTableHeaderCell className={styles.taskCell} scope="row">
        <span className={styles.title}>{task.title}</span>
      </DataTableHeaderCell>
      <DataTableCell>
        {canWrite ? (
          <TaskStatusSelect
            content={content}
            disabled={pending}
            onChangeAction={(next) => onStatusChangeAction(row, next)}
            status={status}
            taskTitle={task.title}
          />
        ) : (
          <TaskStatusBadge label={content.status[status]} status={status} />
        )}
      </DataTableCell>
      <DataTableCell>
        <TaskActionSideBadge actionSide={task.actionSide} content={content} />
      </DataTableCell>
      <DataTableCell>{assigneeName ?? overview.noAssignee}</DataTableCell>
      <DataTableCell className={styles.contextCell}>
        {customerHref ? (
          <Link
            aria-label={formatMessage(overview.openCustomerNamed, {
              name: row.customerDisplayName,
            })}
            className={styles.customer}
            href={customerHref}
            scroll={false}
          >
            {row.customerDisplayName}
          </Link>
        ) : (
          <span className={styles.customer}>{row.customerDisplayName}</span>
        )}
      </DataTableCell>
      <DataTableCell className={styles.contextCell}>
        <span className={styles.project}>{row.projectTitle}</span>
      </DataTableCell>
      <DataTableCell>
        {task.visibleToCustomer ? (
          <span className={styles.visibility}>
            <FontAwesomeIcon aria-hidden="true" icon={faEye} />
            {content.visibility.visible}
          </span>
        ) : (
          <span className={styles.visibility}>{content.visibility.hidden}</span>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}
