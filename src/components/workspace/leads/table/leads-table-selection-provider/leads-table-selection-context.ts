"use client";

import { createContext, useContext } from "react";

export type LeadsTableSelectionContextValue = {
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

export const LeadsTableSelectionContext =
  createContext<LeadsTableSelectionContextValue | null>(null);

export function useLeadsTableSelection() {
  const context = useContext(LeadsTableSelectionContext);

  if (context == null) {
    throw new Error(
      "useLeadsTableSelection must be used within LeadsTableSelectionProvider",
    );
  }

  return context;
}
