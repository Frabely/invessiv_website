"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reports whether a media query currently matches.
 *
 * The server snapshot is always `false`, so callers must not let the result
 * decide what gets rendered on the first pass — otherwise the markup flips
 * after hydration. Use it for behaviour that only starts on interaction, and
 * leave first-paint layout to CSS.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!window.matchMedia) {
        return () => {};
      }

      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);

      return () => {
        mediaQueryList.removeEventListener("change", onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (!window.matchMedia) {
      return false;
    }

    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot(): boolean {
  return false;
}
