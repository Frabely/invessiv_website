"use client";

import type { ReactNode } from "react";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { Widget } from "@invessiv/ui";
import { formatMessage } from "@/lib/i18n/format-message";
import { PortalAllDoneNote } from "../../portal-all-done-note/portal-all-done-note";
import {
  PortalTaskList,
  type PortalTaskListProps,
} from "../../portal-task-list/portal-task-list";
import styles from "./portal-customer-tasks-widget.module.css";

const SUMMARY_LIMIT = 3;

export type PortalCustomerTasksWidgetProps = Omit<
  PortalTaskListProps,
  "showDescription" | "tasks"
> & {
  /** Rendered below the list in the owner view; its id describes the disabled checkboxes. */
  ownerNotice: ReactNode;
  onOpenAction: () => void;
  openTasks: readonly PortalCustomerTaskDto[];
};

/**
 * Shows the first open items. A task ticked off here stays in place until the refresh, so the
 * list does not jump under the pointer.
 */
export function PortalCustomerTasksWidget({
  onOpenAction,
  openTasks,
  ownerNotice,
  ...listProps
}: PortalCustomerTasksWidgetProps) {
  const content = listProps.content.widgets.customerTasks;
  const summary = openTasks.slice(0, SUMMARY_LIMIT);
  const remaining = openTasks.length - summary.length;
  const openCount = openTasks.filter((task) => !listProps.isDone(task)).length;

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
      {ownerNotice}
    </Widget>
  );
}
