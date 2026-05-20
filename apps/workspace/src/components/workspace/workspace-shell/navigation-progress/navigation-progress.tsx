"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./navigation-progress.module.css";

type Props = {
  delayMs?: number;
  isPending: boolean;
};

export function NavigationProgress({ isPending, delayMs = 300 }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isPending) {
      timerRef.current = setTimeout(() => setIsVisible(true), delayMs);
    } else {
      timerRef.current = setTimeout(() => setIsVisible(false), 0);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPending, delayMs]);

  if (!isVisible) return null;

  return <div aria-hidden="true" className={styles.bar} />;
}
