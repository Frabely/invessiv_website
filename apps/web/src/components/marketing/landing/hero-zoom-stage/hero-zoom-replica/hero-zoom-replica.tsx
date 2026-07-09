import type { ReactNode } from "react";

import styles from "./hero-zoom-replica.module.css";

type HeroZoomReplicaProps = {
  children: ReactNode;
  headerSlot?: ReactNode;
};

export function HeroZoomReplica({
  children,
  headerSlot,
}: HeroZoomReplicaProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.replica}
      data-hero-zoom-replica=""
      inert
    >
      {headerSlot ? (
        <div className={styles.header} data-hero-zoom-replica-header="">
          {headerSlot}
        </div>
      ) : null}
      {children}
    </div>
  );
}
