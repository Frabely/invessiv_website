"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const OFFSCREEN_MARGIN = 120;

/**
 * Holds a section's backdrop still against the viewport while the section
 * scrolls past it, so the section reads as a window onto a standing image.
 * Emulates `background-attachment: fixed`, which Safari on iOS ignores.
 */
export function useViewportAnchoredBackdrop(
  sectionRef: RefObject<HTMLElement | null>,
  backdropRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const section = sectionRef.current;
    const backdrop = backdropRef.current;

    if (!section || !backdrop || typeof window.matchMedia !== "function") {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    let frame = 0;
    let scheduled = false;
    let lastShift = Number.NaN;

    const clearAnchor = () => {
      backdrop.style.removeProperty("transform");
      lastShift = Number.NaN;
    };

    const applyAnchor = () => {
      if (reducedMotionMedia.matches) {
        clearAnchor();
        return;
      }

      const bounds = section.getBoundingClientRect();

      if (
        bounds.bottom < -OFFSCREEN_MARGIN ||
        bounds.top > window.innerHeight + OFFSCREEN_MARGIN
      ) {
        return;
      }

      const shift = Math.round(-bounds.top * 10) / 10;

      if (shift === lastShift) {
        return;
      }

      lastShift = shift;
      backdrop.style.transform = `translate3d(0, ${shift}px, 0)`;
    };

    const scheduleAnchor = () => {
      if (scheduled) {
        return;
      }

      scheduled = true;
      frame = window.requestAnimationFrame(() => {
        scheduled = false;
        applyAnchor();
      });
    };

    applyAnchor();
    window.addEventListener("scroll", scheduleAnchor, { passive: true });
    window.addEventListener("resize", scheduleAnchor);
    reducedMotionMedia.addEventListener("change", scheduleAnchor);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleAnchor);
      window.removeEventListener("resize", scheduleAnchor);
      reducedMotionMedia.removeEventListener("change", scheduleAnchor);
      clearAnchor();
    };
  }, [sectionRef, backdropRef]);
}
