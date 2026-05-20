"use client";

import { useEffect, useRef } from "react";
import { useLeadsTableSelection } from "../leads-table-selection-provider/leads-table-selection-context";
import styles from "./leads-table-select-all-checkbox.module.css";

type LeadsTableSelectAllCheckboxProps = {
  ariaLabel: string;
};

export function LeadsTableSelectAllCheckbox({
  ariaLabel,
}: LeadsTableSelectAllCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const { allSelected, someSelected, toggleAll } = useLeadsTableSelection();

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [allSelected, someSelected]);

  return (
    <label className={styles.root}>
      <input
        aria-label={ariaLabel}
        checked={allSelected}
        className={styles.input}
        onChange={toggleAll}
        ref={checkboxRef}
        type="checkbox"
      />
      <span aria-hidden="true" className={styles.box} />
    </label>
  );
}
