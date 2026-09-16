"use client";

import { useDelayedPending } from "@/hooks/workspace/use-delayed-pending";
import styles from "./navigation-progress.module.css";

type Props = {
  delayMs?: number;
  isPending: boolean;
};

export function NavigationProgress({ isPending, delayMs = 300 }: Props) {
  const isVisible = useDelayedPending(isPending, delayMs);

  if (!isVisible) return null;

  return <div aria-hidden="true" className={styles.bar} />;
}
