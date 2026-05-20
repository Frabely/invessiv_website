"use client";

import { createContext, type TransitionStartFunction, useContext } from "react";

export const NavigationContext = createContext<TransitionStartFunction>(
  (callback) => callback(),
);

export function useNavigationContext(): TransitionStartFunction {
  return useContext(NavigationContext);
}
