"use client";

import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@/lib/i18n/format-message";
import { PortalDueHint } from "../portal-due-hint/portal-due-hint";
import { PortalTaskCheckbox } from "../portal-task-checkbox/portal-task-checkbox";
import styles from "./portal-task-list.module.css";

export type PortalTaskListProps = {
  canComplete: boolean;
  content: PortalDashboardDictionary;
  isDone: (task: PortalCustomerTaskDto) => boolean;
  isOwnerView: boolean;
  isPending: (taskId: string) => boolean;
  locale: Locale;
  onCompleteAction: (task: PortalCustomerTaskDto) => void;
  ownerHintId?: string;
  showDescription?: boolean;
  tasks: readonly PortalCustomerTaskDto[];
  today: string;
};

export function PortalTaskList({
  canComplete,
  content,
  isDone,
  isOwnerView,
  isPending,
  locale,
  onCompleteAction,
  ownerHintId,
  showDescription = false,
  tasks,
  today,
}: PortalTaskListProps) {
  const labels = content.widgets.customerTasks;

  return (
    <ul className={styles.list}>
      {tasks.map((task) => {
        const done = isDone(task);
        return (
          <li className={styles.item} data-done={done} key={task.id}>
            <PortalTaskCheckbox
              checked={done}
              describedById={isOwnerView ? ownerHintId : undefined}
              enabled={canComplete}
              label={formatMessage(labels.checkboxLabel, { name: task.title })}
              onCompleteAction={() => onCompleteAction(task)}
              pending={isPending(task.id)}
              readOnly={!canComplete && !isOwnerView}
              statusLabel={formatMessage(
                done ? labels.doneLabel : labels.openLabel,
                { name: task.title },
              )}
            />
            <div className={styles.text}>
              <span className={styles.title}>{task.title}</span>
              {showDescription && task.description ? (
                <span className={styles.description}>{task.description}</span>
              ) : null}
              <span className={styles.meta}>
                <span className={styles.project}>{task.projectTitle}</span>
                <PortalDueHint
                  content={content.due}
                  locale={locale}
                  task={{ ...task, done }}
                  today={today}
                />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
