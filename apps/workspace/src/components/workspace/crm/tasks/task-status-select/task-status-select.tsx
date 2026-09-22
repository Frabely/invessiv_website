"use client";

import { useId } from "react";

import {
  TASK_STATUS_VALUES,
  type TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { CustomSelect } from "@invessiv/ui";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";

type TaskStatusSelectProps = {
  content: CrmTasksDictionary;
  disabled?: boolean;
  onChangeAction: (status: TaskStatus) => void;
  status: TaskStatus;
  /** Names the task in the accessible label, since every row carries one of these. */
  taskTitle: string;
};

export function TaskStatusSelect({
  content,
  disabled,
  onChangeAction,
  status,
  taskTitle,
}: TaskStatusSelectProps) {
  const id = useId();

  return (
    <CustomSelect
      ariaLabel={formatMessage(content.row.statusLabel, { name: taskTitle })}
      disabled={disabled}
      id={id}
      onChange={(next) => onChangeAction(next as TaskStatus)}
      options={TASK_STATUS_VALUES.map((value) => ({
        label: content.status[value],
        value,
      }))}
      value={status}
    />
  );
}
