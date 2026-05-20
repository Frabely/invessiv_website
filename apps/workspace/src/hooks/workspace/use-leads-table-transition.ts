"use client";

import { createContext, type TransitionStartFunction, useContext } from "react";

export type LeadsTableTransition = {
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

const DEFAULT_LEADS_TABLE_TRANSITION: LeadsTableTransition = {
  isPending: false,
  startTransition: (callback) => callback(),
};

export const LeadsTableTransitionContext = createContext<LeadsTableTransition>(
  DEFAULT_LEADS_TABLE_TRANSITION,
);

export function useLeadsTableTransition(): LeadsTableTransition {
  return useContext(LeadsTableTransitionContext);
}
