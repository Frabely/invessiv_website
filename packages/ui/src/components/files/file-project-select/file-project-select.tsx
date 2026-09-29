"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CustomSelect } from "../../custom-select/custom-select";
import { FormField } from "../../form/form-field/form-field";

export type FileProjectSelectProps = {
  disabled?: boolean;
  label: string;
  options: readonly { value: string; label: string }[];
  value: string | null;
  onChangeAction: (value: string | null) => void;
};

/** Empty option values represent the customer-wide destination. */
export function FileProjectSelect({
  disabled = false,
  label,
  options,
  value,
  onChangeAction,
}: FileProjectSelectProps) {
  return (
    <FormField
      kind={FormFieldKind.Custom}
      label={label}
      renderControl={({ describedBy, id }) => (
        <CustomSelect
          ariaLabel={label}
          describedBy={describedBy}
          disabled={disabled}
          id={id}
          onChange={(next) => onChangeAction(next === "" ? null : next)}
          options={options}
          value={value ?? ""}
        />
      )}
    />
  );
}
