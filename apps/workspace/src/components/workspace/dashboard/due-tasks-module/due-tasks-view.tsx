import Link from "next/link";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskDueState } from "@/common/constants/crm/task-due-states";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import type { Locale } from "@/config/i18n";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { DashboardDueTasksDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { formatMessage } from "@/lib/i18n/format-message";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import { formatIntegerCount } from "@/lib/workspace/dashboard/format-integer";
import { TaskActionSideBadge } from "../../crm/tasks/task-action-side-badge/task-action-side-badge";
import { TaskDueLabel } from "../../crm/tasks/task-due-label/task-due-label";
import styles from "./due-tasks-view.module.css";

type DueTasksViewProps = {
  labels: DashboardDueTasksDictionary;
  locale: Locale;
  /** Already in list order, overdue first. */
  rows: readonly TaskListRowDto[];
  tasksContent: CrmTasksDictionary;
  today: string;
  viewAllHref: string;
};

const TITLE_ID = "dashboard-due-tasks-title";

export function DueTasksView({
  labels,
  locale,
  rows,
  tasksContent,
  today,
  viewAllHref,
}: DueTasksViewProps) {
  const overdue = rows.filter(
    (row) =>
      taskDueStateService.dueState(row.task, today) === TaskDueState.Overdue,
  );
  const dueSoon = rows.filter((row) => !overdue.includes(row));
  const groups = (
    [
      ["overdue", overdue],
      ["dueSoon", dueSoon],
    ] as const
  ).filter(([, groupRows]) => groupRows.length > 0);

  return (
    <section aria-labelledby={TITLE_ID} className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title} id={TITLE_ID}>
          {labels.title}
        </h2>
        <Link
          aria-label={labels.viewAllLabel}
          className={styles.viewAll}
          href={viewAllHref}
        >
          {labels.viewAll}
        </Link>
      </header>

      <div className={styles.groups} data-group-count={groups.length}>
        {groups.map(([key, groupRows]) => {
          const headingId = `${TITLE_ID}-${key}`;
          return (
            <section
              aria-labelledby={headingId}
              className={styles.group}
              data-group={key}
              key={key}
            >
              <h3 className={styles.groupHeading} id={headingId}>
                <span>{labels.groups[key]}</span>
                <span aria-hidden="true" className={styles.groupCount}>
                  {formatIntegerCount(groupRows.length, locale)}
                </span>
                <span className="sr-only">
                  {formatMessage(labels.groupCountLabel, {
                    count: groupRows.length,
                  })}
                </span>
              </h3>
              <ul className={styles.list} role="list">
                {groupRows.map((row) => (
                  <li className={styles.item} key={row.task.id}>
                    <div className={styles.text}>
                      <span className={styles.taskTitle}>{row.task.title}</span>
                      <span className={styles.context}>
                        {formatMessage(labels.context, {
                          customer: row.customerDisplayName,
                          project: row.projectTitle,
                        })}
                      </span>
                    </div>
                    <div className={styles.meta}>
                      <TaskDueLabel
                        content={tasksContent}
                        locale={locale}
                        task={row.task}
                        today={today}
                      />
                      {row.task.actionSide === TaskActionSide.Customer ? (
                        <TaskActionSideBadge
                          actionSide={row.task.actionSide}
                          content={tasksContent}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
