"use client";

import type { Ref } from "react";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonControl, FormField } from "@invessiv/ui";
import { stepDurationInput } from "@/common/patterns/crm/hours/duration-input";
import styles from "./duration-field.module.css";

export type DurationFieldProps = {
  decreaseLabel: string;
  errorMessage?: string;
  hint: string;
  increaseLabel: string;
  inputRef?: Ref<HTMLInputElement>;
  label: string;
  /** Upper bound for the step buttons; typing beyond it is reported by the form's validation. */
  maxMinutes?: number;
  name: string;
  onChangeAction: (value: string) => void;
  /** The text as typed (`1:30`, `1,5`); parsing is left to the form so nothing is rounded silently. */
  value: string;
};

/** A duration typed as `h:mm` or decimal hours, with buttons that move it by one booking step. */
export function DurationField({
  decreaseLabel,
  errorMessage,
  hint,
  increaseLabel,
  inputRef,
  label,
  maxMinutes,
  name,
  onChangeAction,
  value,
}: DurationFieldProps) {
  return (
    <FormField
      errorMessage={errorMessage}
      hint={hint}
      kind={FormFieldKind.Custom}
      label={label}
      renderControl={({ describedBy, id, invalid }) => (
        <span className={styles.row}>
          <ButtonControl
            aria-label={decreaseLabel}
            onClick={() =>
              onChangeAction(stepDurationInput(value, -1, maxMinutes))
            }
            size={ButtonSize.Icon}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faMinus} />
          </ButtonControl>
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid ? "true" : undefined}
            autoComplete="off"
            className={styles.input}
            id={id}
            inputMode="decimal"
            name={name}
            onChange={(event) => onChangeAction(event.target.value)}
            placeholder="0:00"
            ref={inputRef}
            required
            type="text"
            value={value}
          />
          <ButtonControl
            aria-label={increaseLabel}
            onClick={() =>
              onChangeAction(stepDurationInput(value, 1, maxMinutes))
            }
            size={ButtonSize.Icon}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          </ButtonControl>
        </span>
      )}
      required
    />
  );
}
