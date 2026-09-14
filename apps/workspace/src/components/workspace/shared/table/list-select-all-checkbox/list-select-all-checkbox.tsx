"use client";

import { useEffect, useRef } from "react";
import { CheckboxControl } from "@invessiv/ui";
import { useListSelection } from "../list-selection-provider/list-selection-context";

type ListSelectAllCheckboxProps = {
  ariaLabel: string;
};

export function ListSelectAllCheckbox({
  ariaLabel,
}: ListSelectAllCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const { allSelected, someSelected, toggleAll } = useListSelection();

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
