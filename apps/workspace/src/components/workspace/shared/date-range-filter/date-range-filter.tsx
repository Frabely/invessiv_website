"use client";

import type { DateRangeFilterLabels } from "@/common/contracts/date-range-filter-labels";
import styles from "./date-range-filter.module.css";

type DateRangeFilterProps = {
  className?: string;
  fromValue: string;
  labels: DateRangeFilterLabels;
  onFromChangeAction: (value: string | undefined) => void;
  onToChangeAction: (value: string | undefined) => void;
  toValue: string;
};

export function DateRangeFilter({
  className,
  fromValue,
  labels,
  onFromChangeAction,
  onToChangeAction,
  toValue,
}: DateRangeFilterProps) {
  return (
    <div className={className ? `${styles.group} ${className}` : styles.group}>
      <span className={styles.label}>{labels.group}</span>
      <div className={styles.inputs}>
        <label className={styles.field}>
          <span className={styles.srOnly}>{labels.from}</span>
          <input
            className={styles.input}
            max={toValue || undefined}
            onChange={(event) =>
              onFromChangeAction(event.target.value || undefined)
            }
            type="date"
            value={fromValue}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.srOnly}>{labels.to}</span>
          <input
            className={styles.input}
            min={fromValue || undefined}
            onChange={(event) =>
              onToChangeAction(event.target.value || undefined)
            }
            type="date"
            value={toValue}
          />
        </label>
      </div>
    </div>
  );
}
