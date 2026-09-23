"use client";

import { type ReactNode } from "react";
import { CustomSelect } from "@invessiv/ui";
import { FacetFilterDisplay } from "@/common/constants/ui/facet-filter-displays";
import styles from "./facet-filter.module.css";

const ALL_OPTION_VALUE = "__all__";

type FacetFilterProps = {
  /** Chips (default) or a select only; see `FacetFilterDisplay`. */
  display?: FacetFilterDisplay;
  activeValue?: string;
  activeValues?: readonly string[];
  allOption: { chip: ReactNode; selectLabel: string };
  ariaLabel: string;
  clearLabel: string;
  label: string;
  onChangeAction: (value: string | undefined) => void;
  onValuesChangeAction?: (values: readonly string[]) => void;
  multiple?: boolean;
  options: ReadonlyArray<{
    value: string;
    chip: ReactNode;
    selectLabel: string;
  }>;
  selectId: string;
};

export function FacetFilter({
  activeValue,
  activeValues = [],
  allOption,
  ariaLabel,
  clearLabel,
  display = FacetFilterDisplay.Chips,
  label,
  onChangeAction,
  onValuesChangeAction,
  options,
  selectId,
  multiple = false,
}: FacetFilterProps) {
  const selectedValues = multiple
    ? activeValues
    : activeValue
      ? [activeValue]
      : [];
  const isAllActive = selectedValues.length === 0;

  function toggleValue(value: string) {
    if (!multiple || !onValuesChangeAction) {
      onChangeAction(value);
      return;
    }
    const next = selectedValues.includes(value)
      ? selectedValues.filter((entry) => entry !== value)
      : [...selectedValues, value];
    onValuesChangeAction(next);
  }

  return (
    <div className={styles.group} data-display={display}>
      <span className={styles.fieldLabel}>{label}</span>

      <div aria-label={ariaLabel} className={styles.chipRow} role="toolbar">
        <button
          aria-pressed={isAllActive}
          className={styles.badgeButton}
          data-active={isAllActive ? "true" : "false"}
          onClick={() =>
            multiple && onValuesChangeAction
              ? onValuesChangeAction([])
              : onChangeAction(undefined)
          }
          type="button"
        >
          {allOption.chip}
        </button>

        {options.map((option) => {
          const isActive = selectedValues.includes(option.value);

          return (
            <button
              aria-pressed={isActive}
              className={styles.badgeButton}
              data-active={isActive ? "true" : "false"}
              key={option.value}
              onClick={() => toggleValue(option.value)}
              type="button"
            >
              {option.chip}
            </button>
          );
        })}
      </div>

      <div className={styles.selectSlot}>
        <CustomSelect<string>
          ariaLabel={ariaLabel}
          clearLabel={clearLabel}
          id={selectId}
          onChange={(next) =>
            next === ALL_OPTION_VALUE
              ? multiple && onValuesChangeAction
                ? onValuesChangeAction([])
                : onChangeAction(undefined)
              : multiple && onValuesChangeAction
                ? onValuesChangeAction([next])
                : onChangeAction(next)
          }
          onClear={
            isAllActive
              ? undefined
              : () =>
                  multiple && onValuesChangeAction
                    ? onValuesChangeAction([])
                    : onChangeAction(undefined)
          }
          options={[
            { value: ALL_OPTION_VALUE, label: allOption.selectLabel },
            ...options.map((option) => ({
              value: option.value,
              label: option.selectLabel,
            })),
          ]}
          value={selectedValues[0] ?? ALL_OPTION_VALUE}
        />
      </div>
    </div>
  );
}
