"use client";

import { type ReactNode, useState } from "react";
import { LeadsTableSelectionContext } from "./leads-table-selection-context";

type LeadsTableSelectionProviderProps = {
  children: ReactNode;
  rowIds: string[];
};

export function LeadsTableSelectionProvider({
  children,
  rowIds,
}: LeadsTableSelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function isSelected(id: string) {
    return selectedIds.includes(id);
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds((current) => {
      if (rowIds.length === 0) {
        return [];
      }

      const allAlreadySelected = rowIds.every((id) => current.includes(id));
      return allAlreadySelected ? [] : [...rowIds];
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <LeadsTableSelectionContext.Provider
      value={{
        allSelected,
        clearSelection,
        isSelected,
        rowIds,
        selectedCount,
        selectedIds,
        someSelected,
        toggleAll,
        toggleRow,
      }}
    >
      {children}
    </LeadsTableSelectionContext.Provider>
  );
}
