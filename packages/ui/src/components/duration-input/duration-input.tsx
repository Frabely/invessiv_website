"use client";

import type { Ref } from "react";
import { useDurationInput } from "../../hooks/use-duration-input";
import { DurationPart } from "./duration-part";
import styles from "./duration-input.module.css";

export type DurationInputProps = {
  describedBy?: string;
  hoursLabel: string;
  minutesLabel: string;
  increaseHoursLabel: string;
  decreaseHoursLabel: string;
  increaseMinutesLabel: string;
  decreaseMinutesLabel: string;
  minuteStep: number;
  maxMinutes: number;
  label?: string;
  id: string;
  invalid?: boolean;
  focusRef?: Ref<HTMLDivElement>;
  onChangeAction: (value: string) => void;
  value: string;
};

/** Hours and minutes are stepped directly; no editable text or on-screen keyboard. */
export function DurationInput({
  describedBy,
  hoursLabel,
  minutesLabel,
  increaseHoursLabel,
  decreaseHoursLabel,
  increaseMinutesLabel,
  decreaseMinutesLabel,
  minuteStep,
  maxMinutes,
  label,
  id,
  invalid,
  focusRef,
  onChangeAction,
  value,
}: DurationInputProps) {
  const duration = useDurationInput(
    value,
    onChangeAction,
    minuteStep,
    maxMinutes,
  );
  return (
    <div aria-label={label} className={styles.input} role="group">
      <DurationPart
        accessibleLabel={label ? `${label} ${hoursLabel}` : hoursLabel}
        label={hoursLabel}
        id={id}
        describedBy={describedBy}
        invalid={invalid}
        focusRef={focusRef}
        increaseLabel={increaseHoursLabel}
        decreaseLabel={decreaseHoursLabel}
        maximum={duration.maxHours}
        value={duration.hours}
        onStepAction={duration.stepHours}
      />
      <span aria-hidden="true" className={styles.separator}>
        :
      </span>
      <DurationPart
        accessibleLabel={minutesLabel}
        label={minutesLabel}
        id={`${id}-minutes`}
        describedBy={describedBy}
        invalid={invalid}
        increaseLabel={increaseMinutesLabel}
        decreaseLabel={decreaseMinutesLabel}
        maximum={duration.maxMinute}
        value={duration.minutes}
        padded
        onStepAction={duration.stepMinutes}
      />
    </div>
  );
}
