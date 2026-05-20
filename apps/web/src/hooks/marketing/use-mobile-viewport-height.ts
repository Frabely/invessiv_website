"use client";

import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--mobile-viewport-height";

export function useMobileViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;

    const updateViewportHeight = () => {
      const viewportHeight = Math.round(
        window.visualViewport?.height ?? window.innerHeight,
      );
      root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${viewportHeight}px`);
    };

    updateViewportHeight();

    const visualViewport = window.visualViewport;

    window.addEventListener("resize", updateViewportHeight, { passive: true });
    window.addEventListener("orientationchange", updateViewportHeight);
    visualViewport?.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      visualViewport?.removeEventListener("resize", updateViewportHeight);
    };
  }, []);
}
