import type { ReactNode } from "react";

import styles from "./hero-zoom-replica.module.css";

type HeroZoomReplicaProps = {
  children: ReactNode;
};

export function HeroZoomReplica({ children }: HeroZoomReplicaProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.replica}
      data-hero-zoom-replica=""
      inert
    >
      {children}
    </div>
  );
}
