"use client";

import { createContext, type TransitionStartFunction, useContext } from "react";

export type TableTransition = {
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

const DEFAULT_TABLE_TRANSITION: TableTransition = {
  isPending: false,
  startTransition: (callback) => callback(),
};

export const TableTransitionContext = createContext<TableTransition>(
  DEFAULT_TABLE_TRANSITION,
);

export function useTableTransition(): TableTransition {
  return useContext(TableTransitionContext);
}
