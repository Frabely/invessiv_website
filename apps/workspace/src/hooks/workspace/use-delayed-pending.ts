"use client";

import { useEffect, useRef, useState } from "react";

export function useDelayedPending(
  isPending: boolean,
  delayMs: number,
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(
      () => setIsVisible(isPending),
      isPending ? delayMs : 0,
    );

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [delayMs, isPending]);

  return isVisible;
}
