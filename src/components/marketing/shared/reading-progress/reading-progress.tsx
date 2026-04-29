"use client";

import { useEffect, useRef } from "react";

import styles from "./reading-progress.module.css";

function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollRange =
    document.documentElement.scrollHeight - window.innerHeight;

  if (scrollRange <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, scrollTop / scrollRange));
}

export function ReadingProgress() {
  const barRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;

    const applyProgress = () => {
      const bar = barRef.current;

      if (!bar) {
        return;
      }

      bar.style.transform = `scaleX(${getScrollProgress()})`;
    };

    const scheduleProgressUpdate = () => {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        applyProgress();
      });
    };

    applyProgress();
    window.addEventListener("scroll", scheduleProgressUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleProgressUpdate, {
      passive: true,
    });

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", scheduleProgressUpdate);
      window.removeEventListener("resize", scheduleProgressUpdate);
    };
  }, []);

  return (
    <div aria-hidden="true" className={styles.track}>
      <span className={styles.bar} ref={barRef} />
    </div>
  );
}
