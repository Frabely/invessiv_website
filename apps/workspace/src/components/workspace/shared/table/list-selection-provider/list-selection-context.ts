"use client";

import { createContext, useContext } from "react";

export type ListSelectionContextValue = {
  allSelected: boolean;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  rowIds: string[];
  selectedCount: number;
  selectedIds: string[];
  someSelected: boolean;
  toggleAll: () => void;
  toggleRow: (id: string) => void;
};

export const ListSelectionContext =
  createContext<ListSelectionContextValue | null>(null);

export function useListSelection() {
  const context = useContext(ListSelectionContext);

  if (context == null) {
    throw new Error(
      "useListSelection must be used within ListSelectionProvider",
    );
  }

  return context;
}
