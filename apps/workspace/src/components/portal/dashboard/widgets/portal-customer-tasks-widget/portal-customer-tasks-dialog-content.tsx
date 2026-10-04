"use client";

import { type ReactNode, useId } from "react";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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

/** Every open item with its detail, then the completed ones in plain sight as a record. */
export function PortalCustomerTasksDialogContent({
  doneTasks,
  openTasks,
  ownerNotice,
  ...listProps
}: PortalCustomerTasksDialogContentProps) {
  const content = listProps.content.widgets.customerTasks;
  const doneHeadingId = useId();

  return (
    <div className={styles.content}>
      <p className={styles.intro}>{content.dialogDescription}</p>
      {ownerNotice}
      {openTasks.length > 0 ? (
        <PortalTaskList {...listProps} showDescription tasks={openTasks} />
      ) : (
        <PortalAllDoneNote text={content.empty} />
      )}
      <section aria-labelledby={doneHeadingId} className={styles.done}>
        <h3 className={styles.doneHeading} id={doneHeadingId}>
          {formatMessage(content.done, { count: doneTasks.length })}
        </h3>
        {doneTasks.length > 0 ? (
          <PortalTaskList {...listProps} tasks={doneTasks} />
        ) : (
          <p className={styles.doneEmpty}>{content.doneEmpty}</p>
        )}
      </section>
    </div>
  );
}
