"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** False during server rendering and hydration; for output that depends on the viewer's time zone. */
export function useIsBrowser(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
