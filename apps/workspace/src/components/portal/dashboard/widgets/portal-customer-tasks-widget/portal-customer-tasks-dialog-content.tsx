"use client";

import type { ReactNode } from "react";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { formatMessage } from "@/lib/i18n/format-message";
import { PortalAllDoneNote } from "../../portal-all-done-note/portal-all-done-note";
import {
  PortalTaskList,
  type PortalTaskListBaseProps,
} from "../../portal-task-list/portal-task-list";
import styles from "./portal-customer-tasks-dialog-content.module.css";

export type PortalCustomerTasksDialogContentProps = PortalTaskListBaseProps & {
  doneTasks: readonly PortalCustomerTaskDto[];
  openTasks: readonly PortalCustomerTaskDto[];
  ownerNotice: ReactNode;
};

/** Every open item with its detail; completed ones stay folded away as a record. */
export function PortalCustomerTasksDialogContent({
  doneTasks,
  openTasks,
  ownerNotice,
  ...listProps
}: PortalCustomerTasksDialogContentProps) {
  const content = listProps.content.widgets.customerTasks;

  return (
    <div className={styles.content}>
      <p className={styles.intro}>{content.dialogDescription}</p>
      {ownerNotice}
      {openTasks.length > 0 ? (
        <PortalTaskList {...listProps} showDescription tasks={openTasks} />
      ) : (
        <PortalAllDoneNote text={content.empty} />
      )}
      <details className={styles.done}>
        <summary className={styles.doneSummary}>
          {formatMessage(content.done, { count: doneTasks.length })}
        </summary>
        {doneTasks.length > 0 ? (
          <PortalTaskList {...listProps} tasks={doneTasks} />
        ) : (
          <p className={styles.doneEmpty}>{content.doneEmpty}</p>
        )}
      </details>
    </div>
  );
}
