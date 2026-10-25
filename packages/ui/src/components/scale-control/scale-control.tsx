"use client";

import { useId } from "react";
import type { ScaleControlOption } from "@invessiv/common/contracts/ui/scale-control-option";
import styles from "./scale-control.module.css";

export type ScaleControlProps = {
  options: readonly ScaleControlOption[];
  value: string;
  id?: string;
  low?: string | null;
  high?: string | null;
  compact?: boolean;
  disabled?: boolean;
  onChangeAction?: (value: string) => void;
};

/** Native radios handle arrow keys; without a callback the caller supplies the spoken answer. */
export function ScaleControl({
  options,
  value,
  id,
  low,
  high,
  compact = false,
  disabled = false,
  onChangeAction,
}: ScaleControlProps) {
  const generatedId = useId();
  const name = id ?? generatedId;
  return (
    <div className={styles.scale} data-compact={compact ? "true" : undefined}>
      <div
        aria-hidden={onChangeAction ? undefined : "true"}
        className={styles.track}
      >
        {options.map((option, index) =>
          onChangeAction ? (
            <label
              className={styles.step}
              data-checked={value === option.value ? "true" : undefined}
              data-input="true"
              key={option.value}
            >
              <input
                aria-label={option.accessibleLabel ?? option.label}
                checked={value === option.value}
                disabled={disabled}
                id={index === 0 ? id : undefined}
                name={name}
                onChange={() => onChangeAction(option.value)}
                type="radio"
                value={option.value}
              />
              <span aria-hidden="true">{option.label}</span>
            </label>
          ) : (
            <span
              className={styles.step}
              data-checked={value === option.value ? "true" : undefined}
              key={option.value}
            >
              {option.label}
            </span>
          ),
        )}
      </div>
      {low || high ? (
        <div aria-hidden="true" className={styles.poles}>
          <span>{low}</span>
          <span>{high}</span>
        </div>
      ) : null}
    </div>
  );
}
