"use client";

import { useRef } from "react";
import { useHeroVisualTilt } from "@/hooks/marketing/use-hero-visual-tilt";
import styles from "./hero-visual.module.css";

type HeroVisualProps = {
  ariaLabel: string;
  decorative?: boolean;
  shotClassName?: string;
};

export function HeroVisual({
  ariaLabel,
  decorative = false,
  shotClassName,
}: HeroVisualProps) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  useHeroVisualTilt(shotRef, !decorative);
  const shotClass = shotClassName
    ? `${styles.shot} ${shotClassName}`
    : styles.shot;

  return (
    <aside aria-label={ariaLabel} className={styles.visual}>
      <div className={`${styles.blob} ${styles.blobOne}`} />
      <div className={`${styles.blob} ${styles.blobTwo}`} />
      <div className={`${styles.blob} ${styles.blobThree}`} />
      <div className={shotClass} ref={shotRef}>
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
              className={styles.backplateFrame}
              height="300"
              rx="18"
              width="524"
              x="18"
              y="20"
            />
            <rect
              className={styles.backplateBar}
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
              className={styles.metricLinePrimary}
              height="12"
              rx="6"
              width="220"
              x="42"
              y="86"
            />
            <rect
              className={styles.metricLineSecondary}
              height="12"
              rx="6"
              width="360"
              x="42"
              y="112"
            />
            <rect
              className={styles.panelPrimary}
              height="112"
              rx="14"
              width="200"
              x="42"
              y="164"
            />
            <rect
              className={styles.panelSecondary}
              height="112"
              rx="14"
              width="260"
              x="258"
              y="164"
            />
            <path
              className={styles.chartLineWarm}
              d="M110 250c24-12 48-12 72 0"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <path
              className={styles.chartLineCool}
              d="M300 250c28-16 58-16 86 0"
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
            <circle className={styles.statusWarm} cx="496" cy="60" r="10" />
            <circle className={styles.statusSoft} cx="464" cy="60" r="10" />
            <circle className={styles.statusCool} cx="432" cy="60" r="10" />
          </svg>
        </div>

        <div className={styles.shine} />
      </div>
    </aside>
  );
}
