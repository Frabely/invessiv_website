"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import styles from "./klarkompass-spine.module.css";

type KlarkompassSpineProps = {
  className?: string;
};

/**
 * Vertical "bearing line" that draws itself as the surrounding section scrolls
 * through the viewport. Purely decorative (aria-hidden); fully drawn and static
 * when reduced motion is requested.
 */
export function KlarkompassSpine({ className }: KlarkompassSpineProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className={`${styles.spine} ${className ?? ""}`.trim()}
      ref={ref}
    >
      <svg
        className={styles.svg}
        preserveAspectRatio="none"
        viewBox="0 0 2 100"
      >
        <path
          className={styles.track}
          d="M1 0 V100"
          vectorEffect="non-scaling-stroke"
        />
        <motion.path
          className={styles.draw}
          d="M1 0 V100"
          style={{ pathLength: reduce ? 1 : pathLength }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
