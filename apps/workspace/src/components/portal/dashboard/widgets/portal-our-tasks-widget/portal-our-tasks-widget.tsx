"use client";

import type { ReactNode } from "react";
import { faPersonDigging, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { PortalOurTaskDto } from "@invessiv/common/contracts/portal/portal-our-task.dto";
import { Badge, ButtonControl, Widget } from "@invessiv/ui";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
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
 * The customer sees a clear workflow status for visible team tasks, without internal ownership.
 * Recent completions and declined customer requests remain visible below active work.
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
  const openTasks = tasks.filter(
    (task) =>
      task.status === TaskStatus.Open || task.status === TaskStatus.InProgress,
  );
  const listed = tasks;

  function renderList(items: readonly PortalOurTaskDto[]) {
    return (
      <ul className={styles.list}>
        {items.map((task) => (
          <li className={styles.item} data-status={task.status} key={task.id}>
            <span className={styles.text}>
              <span className={styles.title}>{task.title}</span>
              <span className={styles.meta}>
                <Badge
                  icon={TASK_STATUS_ICONS[task.status]}
                  kind="status"
                  label={labels.status[task.status]}
                  tone={TASK_STATUS_BADGE_TONES[task.status]}
                />
                {task.requestedByCustomer ? (
                  <span className={styles.origin}>{labels.fromYou}</span>
                ) : null}
                {task.status === TaskStatus.Open ||
                task.status === TaskStatus.InProgress ? (
                  <PortalDueHint
                    content={content.due}
                    locale={locale}
                    task={task}
                    today={today}
                  />
                ) : null}
              </span>
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
