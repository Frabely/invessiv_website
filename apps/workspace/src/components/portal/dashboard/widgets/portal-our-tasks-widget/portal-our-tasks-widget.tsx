"use client";

import type { ReactNode } from "react";
import { faPersonDigging, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalOurTaskDto } from "@invessiv/common/contracts/portal/portal-our-task.dto";
import { ButtonControl, Widget } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalDueHint } from "../../portal-due-hint/portal-due-hint";
import styles from "./portal-our-tasks-widget.module.css";

const SUMMARY_LIMIT = 3;

export type PortalOurTasksWidgetProps = {
  content: PortalDashboardDictionary;
  locale: Locale;
  /** Opens the request dialog; null when the reader may not create a task for the team. */
  onCreateAction: (() => void) | null;
  /** Rendered in the owner view instead of the create button. */
  ownerNotice: ReactNode;
  tasks: readonly PortalOurTaskDto[];
  today: string;
};

/**
 * The customer sees what we work on, never who or with which status detail. What they asked for
 * themselves is marked, and a request the team declined stays listed instead of vanishing.
 */
export function PortalOurTasksWidget({
  content,
  locale,
  onCreateAction,
  ownerNotice,
  tasks,
  today,
}: PortalOurTasksWidgetProps) {
  const labels = content.widgets.ourTasks;
  const openTasks = tasks.filter((task) => !task.done && !task.rejected);
  const listed = [...openTasks, ...tasks.filter((task) => task.rejected)];

  function renderList(items: readonly PortalOurTaskDto[]) {
    return (
      <ul className={styles.list}>
        {items.map((task) => (
          <li
            className={styles.item}
            data-rejected={task.rejected || undefined}
            key={task.id}
          >
            <span aria-hidden="true" className={styles.marker} />
            <span className={styles.text}>
              <span className={styles.title}>{task.title}</span>
              {task.rejected || task.requestedByCustomer || task.dueOn ? (
                <span className={styles.meta}>
                  {task.rejected ? (
                    <span className={styles.rejected}>{labels.rejected}</span>
                  ) : null}
                  {task.requestedByCustomer ? (
                    <span className={styles.origin}>{labels.fromYou}</span>
                  ) : null}
                  {task.rejected ? null : (
                    <PortalDueHint
                      content={content.due}
                      locale={locale}
                      task={task}
                      today={today}
                    />
                  )}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const summary =
    listed.length === 0 ? (
      <p className={styles.empty}>{labels.empty}</p>
    ) : (
      renderList(listed.slice(0, SUMMARY_LIMIT))
    );
  const common = {
    count: openTasks.length,
    icon: faPersonDigging,
    title: labels.title,
    footer: onCreateAction ? (
      <ButtonControl
        className={styles.create}
        onClick={onCreateAction}
        type="button"
        variant="ghost"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
        {labels.create}
      </ButtonControl>
    ) : undefined,
  };

  if (listed.length <= SUMMARY_LIMIT) {
    return (
      <Widget {...common} openMode={WidgetOpenMode.None}>
        {summary}
        {ownerNotice}
      </Widget>
    );
  }

  return (
    <Widget
      {...common}
      closeLabel={labels.less}
      expandedContent={renderList(listed.slice(SUMMARY_LIMIT))}
      openLabel={labels.more}
      openMode={WidgetOpenMode.Expand}
    >
      {summary}
      {ownerNotice}
    </Widget>
  );
}
