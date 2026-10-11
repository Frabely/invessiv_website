"use client";

import type { Ref } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { DurationInput, FormField } from "@invessiv/ui";
import styles from "./duration-field.module.css";

export type DurationFieldProps = {
  decreaseLabel: string;
  increaseLabel: string;
  decreaseHoursLabel: string;
  increaseHoursLabel: string;
  errorMessage?: string;
  hint: string | { touch: string; desktop: string; fallback: string };
  hoursLabel: string;
  minutesLabel: string;
  focusRef?: Ref<HTMLDivElement>;
  label: string;
  maxMinutes?: number;
  name: string;
  onChangeAction: (value: string) => void;
  value: string;
};

/** The CRM form shell around the shared gesture-controlled duration picker. */
export function DurationField({
  decreaseLabel,
  increaseLabel,
  decreaseHoursLabel,
  increaseHoursLabel,
  errorMessage,
  hint,
  hoursLabel,
  minutesLabel,
  focusRef,
  label,
  maxMinutes,
  name,
  onChangeAction,
  value,
}: DurationFieldProps) {
  return (
    <FormField
      controlId={name}
      errorMessage={errorMessage}
      hint={
        typeof hint === "string" ? (
          hint
        ) : (
          <>
            <span className={styles.touchHint}>{hint.touch}</span>
            <span className={styles.desktopHint}>{hint.desktop}</span>
            <span className={styles.fallbackHint}>{hint.fallback}</span>
          </>
        )
      }
      kind={FormFieldKind.Custom}
      label={label}
      required
      renderControl={({ describedBy, id, invalid }) => (
        <DurationInput
          describedBy={describedBy}
          hoursLabel={hoursLabel}
          minutesLabel={minutesLabel}
          increaseHoursLabel={increaseHoursLabel}
          decreaseHoursLabel={decreaseHoursLabel}
          increaseMinutesLabel={increaseLabel}
          decreaseMinutesLabel={decreaseLabel}
          minuteStep={HoursLimits.StepMinutes}
          maxMinutes={maxMinutes ?? HoursLimits.MaxLedgerMinutes}
          label={label}
          id={id}
          invalid={invalid}
          focusRef={focusRef}
          onChangeAction={onChangeAction}
          value={value}
        />
      )}
    />
  );
}
