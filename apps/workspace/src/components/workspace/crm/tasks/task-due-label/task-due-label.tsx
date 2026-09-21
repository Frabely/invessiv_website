import {
  faClock,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { TaskDueState } from "@/common/constants/crm/task-due-states";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import styles from "./task-due-label.module.css";

type TaskDueLabelProps = {
  content: CrmTasksDictionary;
  locale: Locale;
  task: Pick<TaskDto, "dueOn" | "status">;
  /** The current business day (`YYYY-MM-DD`), decided once on the server. */
  today: string;
};

function formatDay(isoDate: string, locale: Locale): string {
  // A due day has no time: parsing and printing it in UTC keeps it the same day everywhere.
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * The deadline as words, never as color alone: an overdue task says how long it has been overdue
 * and carries a warning symbol, so it reads the same without color perception.
 */
export function TaskDueLabel({
  content,
  locale,
  task,
  today,
}: TaskDueLabelProps) {
  if (task.dueOn === null) {
    return <span className={styles.label}>{content.due.none}</span>;
  }

  const state = taskDueStateService.dueState(
    { dueOn: task.dueOn, status: task.status },
    today,
  );

  if (state === TaskDueState.Overdue) {
    const days = taskDueStateService.daysBetween(task.dueOn, today);
    return (
      <span className={styles.label} data-state={state}>
        <FontAwesomeIcon aria-hidden="true" icon={faTriangleExclamation} />
        {days === 1
          ? content.due.overdueOne
          : formatMessage(content.due.overdue, { count: days })}
      </span>
    );
  }

  if (state === TaskDueState.DueSoon) {
    const days = taskDueStateService.daysBetween(today, task.dueOn);
    return (
      <span className={styles.label} data-state={state}>
        <FontAwesomeIcon aria-hidden="true" icon={faClock} />
        {days === 0
          ? content.due.today
          : days === 1
            ? content.due.tomorrow
            : formatMessage(content.due.soon, { count: days })}
      </span>
    );
  }

  return (
    <span className={styles.label}>
      {formatMessage(content.due.on, { date: formatDay(task.dueOn, locale) })}
    </span>
  );
}
