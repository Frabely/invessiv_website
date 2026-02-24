"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function usePackagesRondell(
  trackRef: RefObject<HTMLDivElement | null>,
  cardsCount: number,
  featuredIndex: number = 0,
) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || cardsCount < 2) {
      return;
    }

    let x = 0;
    let cardWidth = 0;
    let cardSlotWidth = 0;
    let loopWidth = 0;
    let recenterMin = 0;
    let recenterMax = 0;
    let centerOffset = 0;
    let startX = 0;
    let startOffset = 0;
    let dragging = false;
    let initialized = false;

    const normalizeOffset = () => {
      if (!loopWidth || (x >= recenterMin && x <= recenterMax)) {
        return;
      }

      while (x < recenterMin) {
        x += loopWidth;
      }
      while (x > recenterMax) {
        x -= loopWidth;
      }
    };

    const applyTransform = () => {
      normalizeOffset();
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    };

    const measure = () => {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) {
        return;
      }

      const gap = Number.parseFloat(window.getComputedStyle(track).gap || "0");
      cardWidth = first.getBoundingClientRect().width;
      cardSlotWidth = cardWidth + gap;
      loopWidth = cardSlotWidth * cardsCount;
      const viewportWidth =
        track.parentElement?.clientWidth ?? track.clientWidth;
      centerOffset = Math.max(0, (viewportWidth - cardWidth) / 2);
      recenterMin = loopWidth - cardSlotWidth * 1.5 - centerOffset;
      recenterMax = loopWidth * 2 + cardSlotWidth * 1.5 - centerOffset;

      if (!initialized) {
        x = loopWidth + featuredIndex * cardSlotWidth - centerOffset;
        initialized = true;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      startX = event.clientX;
      startOffset = x;
      track.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const dragDelta = event.clientX - startX;
      x = startOffset - dragDelta;
      applyTransform();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      dragging = false;
      try {
        track.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }
    };

    const onResize = () => {
      measure();
      applyTransform();
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", onResize);

    measure();
    applyTransform();

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [cardsCount, featuredIndex, trackRef]);
}
