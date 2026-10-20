"use client";

import { useEffect, useRef } from "react";

/**
 * Moves the focus to `ref` once the entity arrives with at least the version a write produced.
 * A write can swap the focused control for another one elsewhere in the tree (the refreshed
 * entity renders it in a new place), so the focus waits for that render instead of the response.
 */
export function useFocusAfterVersion<TElement extends HTMLElement>(
  version: number,
) {
  const ref = useRef<TElement>(null);
  const target = useRef<number | null>(null);

  useEffect(() => {
    if (target.current === null || version < target.current) return;
    target.current = null;
    ref.current?.focus();
  }, [version]);

  function focusAfter(savedVersion: number) {
    target.current = savedVersion;
  }

  return { ref, focusAfter };
}
