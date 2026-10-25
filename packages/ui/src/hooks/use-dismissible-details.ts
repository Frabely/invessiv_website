"use client";

import { useEffect, type RefObject } from "react";

export function useDismissibleDetails(
  detailsRef: RefObject<HTMLDetailsElement | null>,
) {
  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const dismissOutside = (event: Event) => {
      if (
        details.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    };

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (!details.open || event.key !== "Escape") return;
      details.open = false;
      details.querySelector("summary")?.focus();
      event.preventDefault();
    };

    document.addEventListener("pointerdown", dismissOutside, true);
    document.addEventListener("focusin", dismissOutside, true);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside, true);
      document.removeEventListener("focusin", dismissOutside, true);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [detailsRef]);
}
