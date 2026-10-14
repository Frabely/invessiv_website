"use client";

import { CustomSelect, FormField } from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import {
  PROJECT_LINE_ITEM_STATUS_VALUES,
  type ProjectLineItemStatus,
} from "@invessiv/common/constants/crm/project-line-item-statuses";

export type LineItemStatusFieldProps = {
  label: string;
  labels: Record<ProjectLineItemStatus, string>;
  value: ProjectLineItemStatus;
  onChangeAction: (value: ProjectLineItemStatus) => void;
};

export function LineItemStatusField({
  label,
  labels,
  value,
  onChangeAction,
}: LineItemStatusFieldProps) {
  return (
    <FormField
      kind={FormFieldKind.Custom}
      label={label}
      renderControl={({ id, describedBy, invalid }) => (
        <CustomSelect
          id={id}
          describedBy={describedBy}
          invalid={invalid}
          value={value}
          onChange={onChangeAction}
          options={PROJECT_LINE_ITEM_STATUS_VALUES.map((status) => ({
            value: status,
            label: labels[status],
          }))}
        />
      )}
    />
  );
}
