"use client";

import { useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MIN_OPACITY = 0.35;
const FADE_START_VIEWPORT_RATIO = 0.85;
const FADE_END_VIEWPORT_RATIO = 0.4;

export function useSectionScrollFade(sectionIds: readonly string[]) {
  const dependencyKey = sectionIds.join("|");

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const sections = dependencyKey
      .split("|")
      .map((sectionId) => document.getElementById(sectionId))
      .filter((element): element is HTMLElement =>
        Boolean(element instanceof HTMLElement),
      );
    if (sections.length < 2) {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    let frame = 0;
    let scheduled = false;

    const clearFades = () => {
      sections.forEach((section) => {
        section.style.removeProperty("opacity");
      });
    };

    const applyFades = () => {
      if (reducedMotionMedia.matches) {
        clearFades();
        return;
      }

      const viewportHeight = window.innerHeight;
      const fadeStart = viewportHeight * FADE_START_VIEWPORT_RATIO;
      const fadeEnd = viewportHeight * FADE_END_VIEWPORT_RATIO;

      for (let index = 0; index < sections.length - 1; index += 1) {
        const nextSection = sections[index + 1];
        const paddingTop =
          Number.parseFloat(window.getComputedStyle(nextSection).paddingTop) ||
          0;
        const contentTop = nextSection.getBoundingClientRect().top + paddingTop;
        const progress = Math.min(
          1,
          Math.max(0, (fadeStart - contentTop) / (fadeStart - fadeEnd)),
        );
        const opacity = 1 - progress * (1 - MIN_OPACITY);
        sections[index].style.opacity = opacity.toFixed(3);
      }
    };

    const scheduleFades = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      frame = window.requestAnimationFrame(() => {
        scheduled = false;
        applyFades();
      });
    };

    applyFades();
    window.addEventListener("scroll", scheduleFades, { passive: true });
    window.addEventListener("resize", scheduleFades);
    reducedMotionMedia.addEventListener("change", scheduleFades);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleFades);
      window.removeEventListener("resize", scheduleFades);
      reducedMotionMedia.removeEventListener("change", scheduleFades);
      clearFades();
    };
  }, [dependencyKey]);
}
