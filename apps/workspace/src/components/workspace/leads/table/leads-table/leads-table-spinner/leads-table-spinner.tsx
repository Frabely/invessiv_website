"use client";

import { useEffect, useRef, useState } from "react";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";
import styles from "./leads-table-spinner.module.css";

type LeadsTableSpinnerProps = {
  ariaLabel: string;
  delayMs?: number;
};

export function LeadsTableSpinner({
  ariaLabel,
  delayMs = 200,
}: LeadsTableSpinnerProps) {
  const { isPending } = useLeadsTableTransition();
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

  return (
    <div
      aria-label={ariaLabel}
      aria-live="polite"
      className={styles.overlay}
      role="status"
    >
      <span aria-hidden="true" className={styles.spinner} />
      <span className={styles.srOnly}>{ariaLabel}</span>
    </div>
  );
}
