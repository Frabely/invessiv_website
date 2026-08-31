"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VISIBILITY_ROOT_MARGIN = "240px 0px 240px 0px";

type StickyScrollProgressOptions = {
  trackRef: RefObject<HTMLElement | null>;
  onProgressAction: (progress: number) => void;
};

/**
 * Reports how far a tall section has travelled past its sticky child, as 0..1.
 * Under reduced motion the progress stays at 1 so consumers render their end state.
 */
export function useStickyScrollProgress({
  trackRef,
  onProgressAction,
}: StickyScrollProgressOptions) {
  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const reducedMotionMedia =
      typeof window.matchMedia === "function"
        ? window.matchMedia(REDUCED_MOTION_QUERY)
        : null;

    let frame = 0;
    let isScheduled = false;
    let isTrackVisible = true;
    let visibilityObserver: IntersectionObserver | null = null;

    const updateProgress = () => {
      if (reducedMotionMedia?.matches) {
        onProgressAction(1);
        return;
      }

      const rect = track.getBoundingClientRect();
      const travelRange = rect.height - window.innerHeight;
      const rawProgress = travelRange > 0 ? -rect.top / travelRange : 1;

      onProgressAction(Math.max(0, Math.min(1, rawProgress)));
    };

    const scheduleUpdate = () => {
      if (!isTrackVisible || isScheduled) {
        return;
      }

      isScheduled = true;
      frame = window.requestAnimationFrame(() => {
        isScheduled = false;
        updateProgress();
      });
    };

    if ("IntersectionObserver" in window) {
      isTrackVisible = false;
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry) {
            return;
          }

          isTrackVisible = entry.isIntersecting;

          if (isTrackVisible) {
            scheduleUpdate();
          }
        },
        { threshold: 0, rootMargin: VISIBILITY_ROOT_MARGIN },
      );
      visibilityObserver.observe(track);
    }

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotionMedia?.addEventListener("change", updateProgress);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotionMedia?.removeEventListener("change", updateProgress);
      visibilityObserver?.disconnect();
    };
  }, [onProgressAction, trackRef]);
}
