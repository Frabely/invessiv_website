"use client";

import { type ReactNode, useState } from "react";
import { ListSelectionContext } from "./list-selection-context";

type ListSelectionProviderProps = {
  children: ReactNode;
  rowIds: string[];
  selectionResetKey?: string;
};

export function ListSelectionProvider({
  children,
  rowIds,
  selectionResetKey,
}: ListSelectionProviderProps) {
  return (
    <ListSelectionProviderInner
      key={selectionResetKey ?? "__default__"}
      rowIds={rowIds}
    >
      {children}
    </ListSelectionProviderInner>
  );
}

function ListSelectionProviderInner({
  children,
  rowIds,
}: Omit<ListSelectionProviderProps, "selectionResetKey">) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const rowIdSet = new Set(rowIds);
  const normalizedSelectedIds = selectedIds.filter((id) => rowIdSet.has(id));
  const selectedCount = normalizedSelectedIds.length;
  const allSelected =
    rowIds.length > 0 &&
    rowIds.every((id) => normalizedSelectedIds.includes(id));
  const someSelected = selectedCount > 0 && !allSelected;

  function isSelected(id: string) {
    return normalizedSelectedIds.includes(id);
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
    <ListSelectionContext.Provider
      value={{
        allSelected,
        clearSelection,
        isSelected,
        rowIds,
        selectedCount,
        selectedIds: normalizedSelectedIds,
        someSelected,
        toggleAll,
        toggleRow,
      }}
    >
      {children}
    </ListSelectionContext.Provider>
  );
}
