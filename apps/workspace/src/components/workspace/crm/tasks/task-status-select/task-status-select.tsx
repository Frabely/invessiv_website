"use client";

import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  TASK_STATUS_VALUES,
  type TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import type { CustomSelectSize } from "@invessiv/common/constants/ui/custom-select-sizes";
import { CustomSelect } from "@invessiv/ui";
import { TASK_STATUS_ICONS } from "@/common/constants/crm/badges/task-status-icons";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./task-status-select.module.css";

type TaskStatusSelectProps = {
  content: CrmTasksDictionary;
  disabled?: boolean;
  onChangeAction: (status: TaskStatus) => void;
  size?: CustomSelectSize;
  status: TaskStatus;
  /** Names the task in the accessible label, since every row carries one of these. */
  taskTitle: string;
};

export function TaskStatusSelect({
  content,
  disabled,
  onChangeAction,
  size,
  status,
  taskTitle,
}: TaskStatusSelectProps) {
  const id = useId();

  return (
    <CustomSelect
      ariaLabel={formatMessage(content.row.statusSelectLabel, {
        name: taskTitle,
        status: content.status[status],
      })}
      disabled={disabled}
      id={id}
      onChange={(next) => onChangeAction(next as TaskStatus)}
      options={TASK_STATUS_VALUES.map((value) => ({
        label: content.status[value],
        leading: (
          <span className={styles.icon} data-status={value}>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={TASK_STATUS_ICONS[value]}
            />
          </span>
        ),
        value,
      }))}
      size={size}
      value={status}
    />
  );
}
