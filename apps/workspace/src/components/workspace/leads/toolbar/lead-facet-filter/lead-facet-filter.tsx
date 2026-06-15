"use client";

import { type ReactNode } from "react";
import { CustomSelect } from "@invessiv/ui";
import { LEAD_FILTER_ALL_VALUE } from "@/common/constants/leads/list/lead-filter-all-value";
import styles from "./lead-facet-filter.module.css";

type LeadFacetFilterProps = {
  activeValue: string | undefined;
  allOption: { chip: ReactNode; selectLabel: string };
  ariaLabel: string;
  clearLabel: string;
  label: string;
  onChangeAction: (value: string | undefined) => void;
  options: ReadonlyArray<{
    value: string;
    chip: ReactNode;
    selectLabel: string;
  }>;
  selectId: string;
};

export function LeadFacetFilter({
  activeValue,
  allOption,
  ariaLabel,
  clearLabel,
  label,
  onChangeAction,
  options,
  selectId,
}: LeadFacetFilterProps) {
  const isAllActive = !activeValue;

  return (
    <div className={styles.group}>
      <span className={styles.fieldLabel}>{label}</span>

      <div aria-label={ariaLabel} className={styles.chipRow} role="toolbar">
        <button
          aria-pressed={isAllActive}
          className={styles.badgeButton}
          data-active={isAllActive ? "true" : "false"}
          onClick={() => onChangeAction(undefined)}
          type="button"
        >
          {allOption.chip}
        </button>

        {options.map((option) => {
          const isActive = activeValue === option.value;

          return (
            <button
              aria-pressed={isActive}
              className={styles.badgeButton}
              data-active={isActive ? "true" : "false"}
              key={option.value}
              onClick={() => onChangeAction(option.value)}
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
            onChangeAction(next === LEAD_FILTER_ALL_VALUE ? undefined : next)
          }
          onClear={activeValue ? () => onChangeAction(undefined) : undefined}
          options={[
            { value: LEAD_FILTER_ALL_VALUE, label: allOption.selectLabel },
            ...options.map((option) => ({
              value: option.value,
              label: option.selectLabel,
            })),
          ]}
          value={activeValue ?? LEAD_FILTER_ALL_VALUE}
        />
      </div>
    </div>
  );
}
