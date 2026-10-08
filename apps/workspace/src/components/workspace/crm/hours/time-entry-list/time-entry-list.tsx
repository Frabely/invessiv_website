import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import styles from "./time-entry-list.module.css";

export type TimeEntryListProps = {
  /** False hides both actions; they are never shown disabled. */
  canWrite: boolean;
  content: CrmHoursDictionary["entry"];
  /** Newest first, as the server sorted them. */
  entries: readonly TimeEntryDto[];
  label: string;
  locale: Locale;
  onDeleteAction: (entry: TimeEntryDto) => void;
  onEditAction: (entry: TimeEntryDto) => void;
  /** Titles of the tasks the reader may see; an entry whose task is missing shows no task line. */
  taskTitles: ReadonlyMap<string, string>;
};

/** Consecutive entries of one day share a heading; the server order is kept as it is. */
function groupByDay(entries: readonly TimeEntryDto[]) {
  const groups: { day: string; entries: TimeEntryDto[] }[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last && last.day === entry.performedOn) last.entries.push(entry);
    else groups.push({ day: entry.performedOn, entries: [entry] });
  }
  return groups;
}

/** What the time of a project was spent on, day by day — the same lines the customer will read. */
export function TimeEntryList({
  canWrite,
  content,
  entries,
  label,
  locale,
  onDeleteAction,
  onEditAction,
  taskTitles,
}: TimeEntryListProps) {
  return (
    <div aria-label={label} className={styles.list} role="group">
      {groupByDay(entries).map((group) => {
        const day = formatCalendarDay(group.day, locale);
        return (
          <section className={styles.day} key={group.day}>
            <h4>{day}</h4>
            <ul className={styles.entries}>
              {group.entries.map((entry) => {
                const duration = formatDuration(entry.durationMinutes);
                const taskTitle = entry.taskId
                  ? taskTitles.get(entry.taskId)
                  : undefined;
                return (
                  <li className={styles.entry} key={entry.id}>
                    <span className={styles.duration}>{duration}</span>
                    <span className={styles.text}>
                      <span className={styles.description}>
                        {entry.description}
                      </span>
                      {taskTitle && taskTitle !== entry.description ? (
                        <span className={styles.task}>{taskTitle}</span>
                      ) : null}
                    </span>
                    {entry.billable ? null : (
                      <span className={styles.goodwill}>
                        {content.goodwill}
                      </span>
                    )}
                    {canWrite ? (
                      <span className={styles.actions}>
                        <ButtonControl
                          aria-label={formatMessage(content.editNamed, {
                            duration,
                            date: day,
                          })}
                          onClick={() => onEditAction(entry)}
                          size={ButtonSize.Icon}
                          title={content.edit}
                          type="button"
                          variant="quiet"
                        >
                          <FontAwesomeIcon aria-hidden="true" icon={faPen} />
                        </ButtonControl>
                        <ButtonControl
                          aria-label={formatMessage(content.deleteNamed, {
                            duration,
                            date: day,
                          })}
                          onClick={() => onDeleteAction(entry)}
                          size={ButtonSize.Icon}
                          title={content.delete}
                          type="button"
                          variant="quiet"
                        >
                          <FontAwesomeIcon aria-hidden="true" icon={faTrash} />
                        </ButtonControl>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
