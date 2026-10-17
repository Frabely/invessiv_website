"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept in sync with the viewport. The server and browsers without
 * `matchMedia` answer false, so content that depends on it renders only after hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!window.matchMedia) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
