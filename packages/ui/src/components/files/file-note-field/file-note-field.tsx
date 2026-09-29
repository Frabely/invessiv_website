"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "../../form/form-field/form-field";

export type FileNoteFieldProps = {
  disabled?: boolean;
  label: string;
  placeholder: string;
  value: string;
  onChangeAction: (note: string) => void;
};

export function FileNoteField({
  disabled = false,
  label,
  placeholder,
  value,
  onChangeAction,
}: FileNoteFieldProps) {
  return (
    <FormField
      inputProps={{
        disabled,
        maxLength: 200,
        onChange: (event) => onChangeAction(event.target.value),
        placeholder,
        value,
      }}
      kind={FormFieldKind.Text}
      label={label}
    />
  );
}
