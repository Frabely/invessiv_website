"use client";

import { useState } from "react";
import {
  type DateRangeDefaultPreset,
  DateRangePreset,
  type DateRangePreset as DateRangePresetValue,
} from "@/common/constants/date-range/date-range-presets";
import type { DateRangeChange } from "@/common/contracts/date-range/date-range-change";
import type { DateRangeFilterLabels } from "@/common/contracts/date-range/date-range-filter-labels";
import { getDateRangeForPreset } from "@/common/patterns/date-range/date-range-preset-range";
import styles from "./date-range-filter.module.css";

type DateRangeFilterProps = {
  className?: string;
  defaultPreset?: DateRangeDefaultPreset;
  fromValue: string;
  labels: DateRangeFilterLabels;
  onRangeChangeAction: (change: DateRangeChange) => void;
  toValue: string;
};

function resolvePreset(
  fromValue: string,
  toValue: string,
  defaultPreset: DateRangeDefaultPreset,
): DateRangePresetValue {
  if (!fromValue && !toValue) {
    return defaultPreset;
  }

  for (const preset of [
    DateRangePreset.Today,
    DateRangePreset.Last7Days,
    DateRangePreset.Last30Days,
    DateRangePreset.Last90Days,
  ]) {
    const range = getDateRangeForPreset(preset);
    if (range.from === fromValue && range.to === toValue) {
      return preset;
    }
  }

  return DateRangePreset.Custom;
}

export function DateRangeFilter({
  className,
  defaultPreset = DateRangePreset.Last7Days,
  fromValue,
  labels,
  onRangeChangeAction,
  toValue,
}: DateRangeFilterProps) {
  const [preset, setPreset] = useState<DateRangePresetValue>(() =>
    resolvePreset(fromValue, toValue, defaultPreset),
  );
  const [customFrom, setCustomFrom] = useState(fromValue);
  const [customTo, setCustomTo] = useState(toValue);

  function selectPreset(nextPreset: DateRangePresetValue) {
    setPreset(nextPreset);
    if (nextPreset === DateRangePreset.Custom) {
      const retained =
        fromValue || toValue
          ? { from: fromValue || undefined, to: toValue || undefined }
          : getDateRangeForPreset(defaultPreset);
      setCustomFrom(retained.from ?? "");
      setCustomTo(retained.to ?? "");
      onRangeChangeAction({ preset: nextPreset, ...retained });
      return;
    }

    const range = getDateRangeForPreset(nextPreset);
    setCustomFrom(range.from ?? "");
    setCustomTo(range.to ?? "");
    onRangeChangeAction(range);
  }

  function commitCustom(from: string, to: string) {
    onRangeChangeAction({
      preset: DateRangePreset.Custom,
      from: from || undefined,
      to: to || undefined,
    });
  }

  return (
    <fieldset
      className={className ? `${styles.group} ${className}` : styles.group}
    >
      <legend className={styles.label}>{labels.group}</legend>
      <label className={styles.field}>
        <span className={styles.srOnly}>{labels.preset}</span>
        <select
          className={styles.select}
          onChange={(event) =>
            selectPreset(event.target.value as DateRangePresetValue)
          }
          value={preset}
        >
          <option value={DateRangePreset.Today}>{labels.options.today}</option>
          <option value={DateRangePreset.Last7Days}>
            {labels.options.last7Days}
          </option>
          <option value={DateRangePreset.Last30Days}>
            {labels.options.last30Days}
          </option>
          <option value={DateRangePreset.Last90Days}>
            {labels.options.last90Days}
          </option>
          <option value={DateRangePreset.All}>{labels.options.all}</option>
          <option value={DateRangePreset.Custom}>
            {labels.options.custom}
          </option>
        </select>
      </label>
      {preset === DateRangePreset.Custom && (
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.srOnly}>{labels.from}</span>
            <input
              className={styles.input}
              max={customTo || undefined}
              onChange={(event) => {
                const value = event.target.value;
                const nextTo = customTo && value > customTo ? value : customTo;
                setCustomFrom(value);
                setCustomTo(nextTo);
                commitCustom(value, nextTo);
              }}
              type="date"
              value={customFrom}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.srOnly}>{labels.to}</span>
            <input
              className={styles.input}
              min={customFrom || undefined}
              onChange={(event) => {
                const value = event.target.value;
                const nextFrom =
                  customFrom && value < customFrom ? value : customFrom;
                setCustomFrom(nextFrom);
                setCustomTo(value);
                commitCustom(nextFrom, value);
              }}
              type="date"
              value={customTo}
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
