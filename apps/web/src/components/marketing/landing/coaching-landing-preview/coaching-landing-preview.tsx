"use client";

import { useRef } from "react";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import { usePreviewAnchorFrame } from "@/hooks/marketing/use-preview-anchor-frame";
import { HighlightRing } from "./highlight-ring/highlight-ring";
import { PreviewPage } from "./preview-page/preview-page";
import styles from "./coaching-landing-preview.module.css";

type CoachingLandingPreviewProps = {
  activeAnchor: LandingPreviewAnchor | null;
  content: LandingCoachingPreviewContent;
  highlightVisible?: boolean;
};

export function CoachingLandingPreview({
  activeAnchor,
  content,
  highlightVisible = activeAnchor !== null,
}: CoachingLandingPreviewProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  usePreviewAnchorFrame(trackRef, overlayRef, activeAnchor, highlightVisible);

  return (
    <div className={styles.visual}>
      <div className={styles.frame}>
        <div
          aria-label={content.ariaLabel}
          className={styles.browser}
          data-testid="coaching-preview-browser"
          role="img"
        >
          <div className={styles.browserBar}>
            <div className={styles.windowControls}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.addressBar}>
              <span className={styles.lockMark}>•</span>
              <span>{content.browserLabel}</span>
            </div>
            <span className={styles.demoBadge}>{content.demoLabel}</span>
          </div>

          <div className={styles.track} ref={trackRef}>
            <div className={styles.panLayer}>
              <PreviewPage content={content} />
              <HighlightRing overlayRef={overlayRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
