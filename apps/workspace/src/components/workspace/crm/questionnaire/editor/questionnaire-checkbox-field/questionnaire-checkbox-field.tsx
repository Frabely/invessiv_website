"use client";

import { useId } from "react";
import { CheckboxControl } from "@invessiv/ui";
import styles from "./questionnaire-checkbox-field.module.css";

export type QuestionnaireCheckboxFieldProps = {
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  label: string;
  onChangeAction: (checked: boolean) => void;
};

/** A checkbox with its label and an optional explanation read with it. */
export function QuestionnaireCheckboxField({
  checked,
  disabled,
  hint,
  label,
  onChangeAction,
}: QuestionnaireCheckboxFieldProps) {
  const hintId = useId();
  return (
    <label className={styles.field} data-disabled={disabled || undefined}>
      <CheckboxControl
        aria-describedby={hint ? hintId : undefined}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChangeAction(event.target.checked)}
      />
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint ? (
          <span className={styles.hint} id={hintId}>
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
