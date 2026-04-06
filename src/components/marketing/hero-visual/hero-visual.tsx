"use client";

import { useRef } from "react";
import { useHeroVisualTilt } from "@/hooks/marketing/use-hero-visual-tilt";
import styles from "./hero-visual.module.css";

type HeroVisualProps = {
  ariaLabel: string;
};

export function HeroVisual({ ariaLabel }: HeroVisualProps) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  useHeroVisualTilt(shotRef);

  return (
    <aside aria-label={ariaLabel} className={styles.visual}>
      <div className={`${styles.blob} ${styles.blobOne}`} />
      <div className={`${styles.blob} ${styles.blobTwo}`} />
      <div className={`${styles.blob} ${styles.blobThree}`} />
      <div className={styles.shot} ref={shotRef}>
        <div className={`${styles.layer} ${styles.layerBackplate}`}>
          <svg
            fill="none"
            viewBox="0 0 560 340"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="hero-backplate-gradient"
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="560"
                y1="0"
                y2="340"
              >
                <stop stopColor="rgba(151,175,213,0.30)" />
                <stop offset="0.55" stopColor="rgba(103,128,170,0.22)" />
                <stop offset="1" stopColor="rgba(231,154,73,0.14)" />
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
            <rect
              fill="url(#hero-backplate-gradient)"
              height="18"
              rx="9"
              width="290"
              x="42"
              y="52"
            />
          </svg>
        </div>

        <div className={`${styles.layer} ${styles.layerContent}`}>
          <svg
            fill="none"
            viewBox="0 0 560 340"
            xmlns="http://www.w3.org/2000/svg"
          >
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
              fill="rgba(142,167,205,0.12)"
              height="112"
              rx="14"
              stroke="rgba(153,178,214,0.34)"
              width="200"
              x="42"
              y="164"
            />
            <rect
              fill="rgba(122,148,189,0.1)"
              height="112"
              rx="14"
              stroke="rgba(134,161,201,0.3)"
              width="260"
              x="258"
              y="164"
            />
            <path
              d="M110 250c24-12 48-12 72 0"
              stroke="rgba(153,178,214,0.55)"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <path
              d="M300 250c28-16 58-16 86 0"
              stroke="rgba(130,157,198,0.58)"
              strokeLinecap="round"
              strokeWidth="7"
            />
          </svg>
        </div>

        <div className={`${styles.layer} ${styles.layerHighlights}`}>
          <svg
            fill="none"
            viewBox="0 0 560 340"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="496" cy="60" fill="rgba(231,154,73,0.52)" r="10" />
            <circle cx="464" cy="60" fill="rgba(157,182,218,0.72)" r="10" />
            <circle cx="432" cy="60" fill="rgba(130,157,198,0.62)" r="10" />
          </svg>
        </div>

        <div className={styles.shine} />
      </div>
    </aside>
  );
}
