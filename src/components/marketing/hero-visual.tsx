"use client";

import { useEffect, useRef } from "react";

export function HeroVisual() {
  const visualRef = useRef<HTMLElement | null>(null);
  const shotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const visual = visualRef.current;
    const shot = shotRef.current;

    if (!visual || !shot) {
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

      shot.style.transform = `rotate(-2deg) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    };

    const reset = () => {
      shot.style.transform = "rotate(-2deg)";
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
  }, []);

  return (
    <aside aria-label="Live Performance Snapshot" className="hero__visual" ref={visualRef}>
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="hero-shot" ref={shotRef}>
        <svg fill="none" viewBox="0 0 560 340" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" gradientUnits="userSpaceOnUse" x1="0" x2="560" y1="0" y2="340">
              <stop stopColor="rgba(20,184,166,0.35)" />
              <stop offset="0.55" stopColor="rgba(59,130,246,0.20)" />
              <stop offset="1" stopColor="rgba(245,158,11,0.20)" />
            </linearGradient>
          </defs>
          <rect
            fill="rgba(255,255,255,0.05)"
            height="300"
            rx="18"
            stroke="rgba(255,255,255,0.14)"
            width="524"
            x="18"
            y="20"
          />
          <rect fill="url(#g1)" height="18" rx="9" width="290" x="42" y="52" />
          <rect fill="rgba(255,255,255,0.10)" height="12" rx="6" width="220" x="42" y="86" />
          <rect fill="rgba(255,255,255,0.08)" height="12" rx="6" width="360" x="42" y="112" />
          <rect
            fill="rgba(245,158,11,0.12)"
            height="112"
            rx="14"
            stroke="rgba(245,158,11,0.35)"
            width="200"
            x="42"
            y="164"
          />
          <rect
            fill="rgba(20,184,166,0.10)"
            height="112"
            rx="14"
            stroke="rgba(20,184,166,0.35)"
            width="260"
            x="258"
            y="164"
          />
          <path
            d="M110 250c24-12 48-12 72 0"
            stroke="rgba(245,158,11,0.55)"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <path
            d="M300 250c28-16 58-16 86 0"
            stroke="rgba(20,184,166,0.55)"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <circle cx="496" cy="60" fill="rgba(245,158,11,0.75)" r="10" />
          <circle cx="464" cy="60" fill="rgba(20,184,166,0.75)" r="10" />
          <circle cx="432" cy="60" fill="rgba(99,102,241,0.65)" r="10" />
        </svg>
      </div>
    </aside>
  );
}
