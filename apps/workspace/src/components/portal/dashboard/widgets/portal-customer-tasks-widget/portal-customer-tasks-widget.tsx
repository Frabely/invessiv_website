"use client";

import type { ReactNode } from "react";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { Widget } from "@invessiv/ui";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PortalAllDoneNote } from "../../portal-all-done-note/portal-all-done-note";
import {
  PortalTaskList,
  type PortalTaskListBaseProps,
} from "../../portal-task-list/portal-task-list";
import styles from "./portal-customer-tasks-widget.module.css";

const SUMMARY_LIMIT = 3;
const DONE_SUMMARY_LIMIT = 2;

export type PortalCustomerTasksWidgetProps = PortalTaskListBaseProps & {
  /** Most recently completed first, as the server orders them. */
  doneTasks: readonly PortalCustomerTaskDto[];
  /** Rendered below the list in the owner view; its id describes the disabled checkboxes. */
  ownerNotice: ReactNode;
  onOpenAction: () => void;
  openTasks: readonly PortalCustomerTaskDto[];
};

/**
 * Shows the first open items and, below them, the latest completed ones still ticked. A task
 * ticked off here stays in place until the refresh, so the list does not jump under the pointer.
 */
export function PortalCustomerTasksWidget({
  doneTasks,
  onOpenAction,
  openTasks,
  ownerNotice,
  ...listProps
}: PortalCustomerTasksWidgetProps) {
  const content = listProps.content.widgets.customerTasks;
  const summary = openTasks.slice(0, SUMMARY_LIMIT);
  const remaining = openTasks.length - summary.length;
  const recentlyDone = doneTasks.slice(0, DONE_SUMMARY_LIMIT);
  const openCount = openTasks.filter(
    (task) => !listProps.isDoneAction(task),
  ).length;

  return (
    <Widget
      count={openCount}
      icon={faListCheck}
      onOpenAction={onOpenAction}
      openLabel={content.open}
      openMode={WidgetOpenMode.Dialog}
      title={content.title}
    >
      {summary.length === 0 ? (
        <PortalAllDoneNote text={content.empty} />
      ) : (
        <>
          <PortalTaskList {...listProps} tasks={summary} />
          {remaining > 0 ? (
            <p className={styles.more}>
              {remaining === 1
                ? content.moreOpenOne
                : formatMessage(content.moreOpen, { count: remaining })}
            </p>
          ) : null}
        </>
      )}
      {recentlyDone.length > 0 ? (
        <div className={styles.done}>
          <p className={styles.doneLabel}>{content.recentlyDone}</p>
          <PortalTaskList {...listProps} tasks={recentlyDone} />
        </div>
      ) : null}
      {ownerNotice}
    </Widget>
  );
}
