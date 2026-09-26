"use client";

import { faPersonDigging } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalTaskDto } from "@invessiv/common/contracts/portal/portal-task.dto";
import { Widget } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalDueHint } from "../../portal-due-hint/portal-due-hint";
import styles from "./portal-our-tasks-widget.module.css";

const SUMMARY_LIMIT = 3;

export type PortalOurTasksWidgetProps = {
  content: PortalDashboardDictionary;
  locale: Locale;
  /** Project label on each row only when the list spans several projects. */
  showProject: boolean;
  tasks: readonly PortalTaskDto[];
  today: string;
};

/** Read-only by design: the customer sees what we work on, never who or with which status detail. */
export function PortalOurTasksWidget({
  content,
  locale,
  showProject,
  tasks,
  today,
}: PortalOurTasksWidgetProps) {
  const labels = content.widgets.ourTasks;
  const openTasks = tasks.filter((task) => !task.done);

  function renderList(items: readonly PortalTaskDto[]) {
    return (
      <ul className={styles.list}>
        {items.map((task) => (
          <li className={styles.item} key={task.id}>
            <span aria-hidden="true" className={styles.marker} />
            <span className={styles.text}>
              <span className={styles.title}>{task.title}</span>
              {showProject || task.dueOn ? (
                <span className={styles.meta}>
                  {showProject ? (
                    <span className={styles.project}>{task.projectTitle}</span>
                  ) : null}
                  <PortalDueHint
                    content={content.due}
                    locale={locale}
                    task={task}
                    today={today}
                  />
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const summary =
    openTasks.length === 0 ? (
      <p className={styles.empty}>{labels.empty}</p>
    ) : (
      renderList(openTasks.slice(0, SUMMARY_LIMIT))
    );
  const common = {
    count: openTasks.length,
    icon: faPersonDigging,
    title: labels.title,
  };

  if (openTasks.length <= SUMMARY_LIMIT) {
    return (
      <Widget {...common} openMode={WidgetOpenMode.None}>
        {summary}
      </Widget>
    );
  }

  return (
    <Widget
      {...common}
      closeLabel={labels.less}
      expandedContent={renderList(openTasks.slice(SUMMARY_LIMIT))}
      openLabel={labels.more}
      openMode={WidgetOpenMode.Expand}
    >
      {summary}
    </Widget>
  );
}
