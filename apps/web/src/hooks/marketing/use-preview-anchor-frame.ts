"use client";

import type { RefObject } from "react";
import { useLayoutEffect } from "react";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";

const PAGE_SELECTOR = "[data-preview-page]";

function setLengthProperty(
  element: HTMLElement,
  property: string,
  value: number,
) {
  const nextValue = `${value}px`;

  if (element.style.getPropertyValue(property) !== nextValue) {
    element.style.setProperty(property, nextValue);
  }
}

/**
 * Synchronizes preview panning and highlight geometry with the visible area.
 * The ring shares the page's transformed coordinate system.
 */
export function usePreviewAnchorFrame(
  trackRef: RefObject<HTMLElement | null>,
  overlayRef: RefObject<HTMLElement | null>,
  activeAnchor: LandingPreviewAnchor | null,
) {
  useLayoutEffect(() => {
    const track = trackRef.current;
    const overlay = overlayRef.current;
    const page = track?.querySelector<HTMLElement>(PAGE_SELECTOR);

    if (!track || !overlay || !page) {
      return;
    }

    if (activeAnchor === null) {
      overlay.dataset.active = "false";
      setLengthProperty(track, "--preview-pan", 0);
      return;
    }

    const block = page.querySelector<HTMLElement>(
      `[data-preview-anchor="${activeAnchor}"]`,
    );
    const lastBlock = page.lastElementChild;

    if (!block) {
      overlay.dataset.active = "false";
      setLengthProperty(track, "--preview-pan", 0);
      return;
    }

    let animationFrame: number | null = null;
    let cancelled = false;

    const measure = () => {
      const trackRect = track.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      const lastBlockRect = lastBlock?.getBoundingClientRect();

      const blockTop = blockRect.top - pageRect.top;
      const blockLeft = blockRect.left - pageRect.left;
      const contentHeight = lastBlockRect
        ? lastBlockRect.bottom - pageRect.top
        : pageRect.height;

      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportBottom =
        viewportTop + (visualViewport?.height ?? window.innerHeight);
      const trackHeight = track.clientHeight;
      const visibleTop = Math.max(0, viewportTop - trackRect.top);
      const visibleBottom = Math.max(
        0,
        Math.min(trackHeight, viewportBottom - trackRect.top),
      );
      const visibleCenter =
        visibleBottom > visibleTop
          ? (visibleTop + visibleBottom) / 2
          : trackHeight / 2;
      const minimumTranslation = Math.min(0, visibleBottom - contentHeight);
      const maximumTranslation = visibleTop;
      const centeredTranslation =
        visibleCenter - (blockTop + blockRect.height / 2);
      const translation = Math.min(
        Math.max(centeredTranslation, minimumTranslation),
        maximumTranslation,
      );
      const hasFrame = overlay.dataset.frameReady === "true";

      overlay.dataset.animate = hasFrame ? "true" : "false";
      setLengthProperty(track, "--preview-pan", translation);
      setLengthProperty(overlay, "--preview-ring-top", blockTop);
      setLengthProperty(overlay, "--preview-ring-left", blockLeft);
      setLengthProperty(overlay, "--preview-ring-width", blockRect.width);
      setLengthProperty(overlay, "--preview-ring-height", blockRect.height);
      overlay.dataset.frameReady = "true";
      overlay.dataset.active = "true";
    };

    const scheduleMeasure = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;

        if (!cancelled) {
          measure();
        }
      });
    };

    measure();

    const observer =
      "ResizeObserver" in window ? new ResizeObserver(scheduleMeasure) : null;
    observer?.observe(track);
    observer?.observe(page);
    observer?.observe(block);
    if (lastBlock && lastBlock !== block) {
      observer?.observe(lastBlock);
    }

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("scroll", scheduleMeasure);

    document.fonts?.ready.then(() => {
      if (!cancelled) {
        scheduleMeasure();
      }
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("scroll", scheduleMeasure);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [activeAnchor, overlayRef, trackRef]);
}
