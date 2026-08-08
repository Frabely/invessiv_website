import type { RefObject } from "react";

import styles from "./highlight-ring.module.css";

type HighlightRingProps = {
  overlayRef: RefObject<HTMLDivElement | null>;
};

/**
 * Frames the active demo-page region and dims the surrounding content.
 * The track provides its geometry through custom properties.
 */
export function HighlightRing({ overlayRef }: HighlightRingProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.overlay}
      data-active="false"
      data-animate="false"
      data-frame-ready="false"
      data-testid="coaching-preview-highlight-overlay"
      ref={overlayRef}
    >
      <div className={styles.scrimLayer} />
      <span
        className={styles.ring}
        data-testid="coaching-preview-highlight-ring"
      />
    </div>
  );
}
