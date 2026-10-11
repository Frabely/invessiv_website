"use client";

import { useImperativeHandle, type Ref } from "react";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDurationStepper } from "../../hooks/use-duration-stepper";
import styles from "./duration-input.module.css";

export type DurationPartProps = {
  accessibleLabel: string;
  label: string;
  id: string;
  describedBy?: string;
  invalid?: boolean;
  focusRef?: Ref<HTMLDivElement>;
  increaseLabel: string;
  decreaseLabel: string;
  maximum: number;
  value: number;
  padded?: boolean;
  onStepAction: (steps: number) => void;
};

/** One numeric value, with redundant gesture, wheel, keyboard and button controls. */
export function DurationPart({
  accessibleLabel,
  label,
  id,
  describedBy,
  invalid,
  focusRef,
  increaseLabel,
  decreaseLabel,
  maximum,
  value,
  padded,
  onStepAction,
}: DurationPartProps) {
  const { ref, ...interaction } = useDurationStepper(onStepAction);
  useImperativeHandle(focusRef, () => ref.current as HTMLDivElement);
  return (
    <div className={styles.part}>
      <div className={styles.track} data-invalid={invalid || undefined}>
        <button
          aria-label={increaseLabel}
          className={styles.arrow}
          disabled={value >= maximum}
          onClick={() => onStepAction(1)}
          type="button"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.icon}
            icon={faChevronUp}
          />
        </button>
        <div
          {...interaction}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-label={accessibleLabel}
          aria-valuemax={maximum}
          aria-valuemin={0}
          aria-valuenow={value}
          className={styles.value}
          id={id}
          ref={ref}
          role="spinbutton"
          tabIndex={0}
        >
          {padded ? String(value).padStart(2, "0") : value}
        </div>
        <button
          aria-label={decreaseLabel}
          className={styles.arrow}
          disabled={value <= 0}
          onClick={() => onStepAction(-1)}
          type="button"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.icon}
            icon={faChevronDown}
          />
        </button>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
