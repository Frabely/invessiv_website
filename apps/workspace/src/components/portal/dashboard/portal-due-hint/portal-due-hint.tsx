import { faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import type { PortalTaskDto } from "@invessiv/common/contracts/portal/portal-task.dto";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-due-hint.module.css";

export type PortalDueHintProps = {
  content: PortalDashboardDictionary["due"];
  locale: Locale;
  task: Pick<PortalTaskDto, "done" | "dueOn" | "dueState">;
  /** Business day (`YYYY-MM-DD`) decided once on the server. */
  today: string;
};

/** Overdue work stays visible but is phrased as a date, never as a warning. */
export function PortalDueHint({
  content,
  locale,
  task,
  today,
}: PortalDueHintProps) {
  if (task.done || task.dueOn === null) return null;
  const date = formatCalendarDay(task.dueOn, locale);
  const text =
    task.dueState === TaskDueState.Overdue
      ? formatMessage(content.overdue, { date })
      : task.dueOn === today
        ? content.today
        : formatMessage(content.on, { date });

  return (
    <span className={styles.hint} data-state={task.dueState}>
      <FontAwesomeIcon aria-hidden="true" icon={faCalendarDay} />
      {text}
    </span>
  );
}
