"use client";

import { useEffect, useRef } from "react";

import styles from "./reading-progress.module.css";

function computeProgress(): number {
  if (typeof document === "undefined") {
    return 0;
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max =
    (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0);
  if (max <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, scrollTop / max));
}

export function ReadingProgress() {
  const barRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const apply = () => {
      const bar = barRef.current;
      if (!bar) {
        return;
      }
      bar.style.transform = `scaleX(${computeProgress()})`;
    };

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      apply();
      const onScrollEnd = () => apply();
      window.addEventListener("scrollend", onScrollEnd, { passive: true });
      return () => window.removeEventListener("scrollend", onScrollEnd);
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className={styles.track}>
      <span className={styles.bar} ref={barRef} />
    </div>
  );
}
