"use client";

import { useEffect, useRef } from "react";
import { CheckboxControl } from "@invessiv/ui";
import { useLeadsTableSelection } from "../leads-table-selection-provider/leads-table-selection-context";

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
    <CheckboxControl
      aria-label={ariaLabel}
      checked={allSelected}
      onChange={toggleAll}
      ref={checkboxRef}
    />
  );
}
