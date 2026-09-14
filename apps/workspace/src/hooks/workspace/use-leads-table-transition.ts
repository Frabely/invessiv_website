"use client";

import {
  TableTransitionContext,
  useTableTransition,
} from "./use-table-transition";

export const LeadsTableTransitionContext = TableTransitionContext;

export function useLeadsTableTransition() {
  return useTableTransition();
}
