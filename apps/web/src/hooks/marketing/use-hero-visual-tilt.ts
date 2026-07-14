"use client";

import type { RefObject } from "react";
import { useEffect } from "react";
import type { HeroVisualTiltOptions } from "@/common/contracts/marketing";

export function useHeroVisualTilt(
  shotRef: RefObject<HTMLDivElement | null>,
  options: HeroVisualTiltOptions = {},
) {
  const {
    maximumRotation = 8,
    parallaxDistance = 6,
    restRotation = -2,
  } = options;

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
      const rotateY = Math.max(
        -maximumRotation,
        Math.min(maximumRotation, dx * maximumRotation * 2.25),
      );
      const rotateX = Math.max(
        -maximumRotation,
        Math.min(maximumRotation, -dy * maximumRotation * 2.25),
      );
      const parallaxX = Math.max(
        -parallaxDistance,
        Math.min(parallaxDistance, dx * parallaxDistance * (11 / 6)),
      );
      const parallaxY = Math.max(
        -parallaxDistance,
        Math.min(parallaxDistance, dy * parallaxDistance * (11 / 6)),
      );

      shot.style.transform = `rotate(${restRotation}deg) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      shot.style.setProperty("--hero-parallax-x", `${parallaxX.toFixed(2)}px`);
      shot.style.setProperty("--hero-parallax-y", `${parallaxY.toFixed(2)}px`);
    };

    const reset = () => {
      shot.style.transform = `rotate(${restRotation}deg)`;
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
  }, [maximumRotation, parallaxDistance, restRotation, shotRef]);
}
