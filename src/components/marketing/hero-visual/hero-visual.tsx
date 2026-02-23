"use client";

import { useRef } from "react";
import { useHeroVisualTilt } from "@/hooks/marketing/use-hero-visual-tilt";

export function HeroVisual() {
  const shotRef = useRef<HTMLDivElement | null>(null);
  useHeroVisualTilt(shotRef);

  return (
    <aside aria-label="Live Performance Snapshot" className="hero__visual">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="hero-shot" ref={shotRef}>
        <svg
          fill="none"
          viewBox="0 0 560 340"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="g1"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="560"
              y1="0"
              y2="340"
            >
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
          <rect
            fill="rgba(255,255,255,0.10)"
            height="12"
            rx="6"
            width="220"
            x="42"
            y="86"
          />
          <rect
            fill="rgba(255,255,255,0.08)"
            height="12"
            rx="6"
            width="360"
            x="42"
            y="112"
          />
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
