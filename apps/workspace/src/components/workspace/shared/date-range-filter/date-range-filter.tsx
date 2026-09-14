"use client";

import { useState } from "react";
import { CustomSelect } from "@invessiv/ui";
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
  referenceDateValue: string;
  selectId: string;
  toValue: string;
};

function resolvePreset(
  fromValue: string,
  toValue: string,
  defaultPreset: DateRangeDefaultPreset,
  referenceDateValue: string,
): DateRangePresetValue {
  if (!fromValue && !toValue) {
    return defaultPreset;
  }

  const referenceDate = new Date(`${referenceDateValue}T00:00:00.000Z`);
  if (Number.isNaN(referenceDate.getTime())) {
    return DateRangePreset.Custom;
  }

  for (const preset of [
    DateRangePreset.Today,
    DateRangePreset.Last7Days,
    DateRangePreset.Last30Days,
    DateRangePreset.Last90Days,
  ]) {
    const range = getDateRangeForPreset(preset, referenceDate);
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
  referenceDateValue,
  selectId,
  toValue,
}: DateRangeFilterProps) {
  const [preset, setPreset] = useState<DateRangePresetValue>(() =>
    resolvePreset(fromValue, toValue, defaultPreset, referenceDateValue),
  );
  const [customFrom, setCustomFrom] = useState(fromValue);
  const [customTo, setCustomTo] = useState(toValue);
  const presetOptions = [
    { value: DateRangePreset.Today, label: labels.options.today },
    { value: DateRangePreset.Last7Days, label: labels.options.last7Days },
    { value: DateRangePreset.Last30Days, label: labels.options.last30Days },
    { value: DateRangePreset.Last90Days, label: labels.options.last90Days },
    { value: DateRangePreset.All, label: labels.options.all },
    { value: DateRangePreset.Custom, label: labels.options.custom },
  ];

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
      <div className={styles.field}>
        <CustomSelect<DateRangePresetValue>
          ariaLabel={labels.preset}
          id={selectId}
          onChange={selectPreset}
          options={presetOptions}
          value={preset}
        />
      </div>
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
