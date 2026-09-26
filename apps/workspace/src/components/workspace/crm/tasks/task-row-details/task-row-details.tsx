import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { TaskActionSideBadge } from "../task-action-side-badge/task-action-side-badge";
import { TaskDueLabel } from "../task-due-label/task-due-label";
import styles from "./task-row-details.module.css";

type TaskRowDetailsProps = {
  assigneeName: string | null;
  content: CrmTasksDictionary;
  locale: Locale;
  status: TaskStatus;
  task: TaskDto;
  today: string;
};

export function TaskRowDetails({
  assigneeName,
  content,
  locale,
  status,
  task,
  today,
}: TaskRowDetailsProps) {
  const assigneeLabel = assigneeName
    ? formatMessage(content.row.assignee, { name: assigneeName })
    : null;

  return (
    <>
      <span className={styles.main}>
        <span className={styles.title} data-status={status}>
          {task.title}
        </span>
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
}
