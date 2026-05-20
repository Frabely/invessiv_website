"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function useHeroVisualTilt(shotRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const shot = shotRef.current;

    if (!shot) {
      return;
    }

    const canUsePointerEffect = window.matchMedia(
      "(pointer: fine) and (min-width: 901px) and (prefers-reduced-motion: no-preference)",
    ).matches;

    if (!canUsePointerEffect) {
      return;
    }

    const update = (event: PointerEvent) => {
      const rect = shot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (event.clientX - centerX) / rect.width;
      const dy = (event.clientY - centerY) / rect.height;
      const rotateY = Math.max(-8, Math.min(8, dx * 18));
      const rotateX = Math.max(-8, Math.min(8, -dy * 18));
      const parallaxX = Math.max(-6, Math.min(6, dx * 11));
      const parallaxY = Math.max(-6, Math.min(6, dy * 11));

      shot.style.transform = `rotate(-2deg) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      shot.style.setProperty("--hero-parallax-x", `${parallaxX.toFixed(2)}px`);
      shot.style.setProperty("--hero-parallax-y", `${parallaxY.toFixed(2)}px`);
    };

    const reset = () => {
      shot.style.transform = "rotate(-2deg)";
      shot.style.setProperty("--hero-parallax-x", "0px");
      shot.style.setProperty("--hero-parallax-y", "0px");
    };

    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("pointerleave", reset, { passive: true });
    window.addEventListener("blur", reset);

    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, [shotRef]);
}
