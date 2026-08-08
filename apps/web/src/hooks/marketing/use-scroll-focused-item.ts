"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

type ScrollFocusedItemOptions = {
  enabled: boolean;
  focusRatio?: number;
  itemSelector: string;
  onFocusChange: (index: number | null) => void;
};

/**
 * Reports which item currently sits closest to a reading line in the viewport.
 * Touch layouts use it to follow the scroll position instead of asking for a
 * tap. `onFocusChange` must be stable; it is called only when the item changes.
 */
export function useScrollFocusedItem(
  containerRef: RefObject<HTMLElement | null>,
  {
    enabled,
    focusRatio = 0.7,
    itemSelector,
    onFocusChange,
  }: ScrollFocusedItemOptions,
) {
  useEffect(() => {
    const container = containerRef.current;

    if (!enabled || !container) {
      return;
    }

    let animationFrame: number | null = null;
    let focusedIndex: number | null = null;

    const measure = () => {
      animationFrame = null;

      const items = Array.from(
        container.querySelectorAll<HTMLElement>(itemSelector),
      );
      const readingLine = window.innerHeight * focusRatio;
      let nearestIndex: number | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - readingLine);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nextIndex =
        nearestDistance > window.innerHeight / 2 ? null : nearestIndex;

      if (nextIndex !== focusedIndex) {
        focusedIndex = nextIndex;
        onFocusChange(nextIndex);
      }
    };

    const scheduleMeasure = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      onFocusChange(null);
    };
  }, [containerRef, enabled, focusRatio, itemSelector, onFocusChange]);
}
