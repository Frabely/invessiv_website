"use client";

import { useLayoutEffect, useRef } from "react";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import type {
  LandingCoachingPreviewContent,
  LandingProblemSolutionSeal,
} from "@/common/contracts/marketing";
import { usePreviewAnchorFrame } from "@/hooks/marketing/use-preview-anchor-frame";
import { ApprovalSeal } from "./approval-seal/approval-seal";
import { HighlightRing } from "./highlight-ring/highlight-ring";
import { PreviewPage } from "./preview-page/preview-page";
import styles from "./coaching-landing-preview.module.css";

type CoachingLandingPreviewProps = {
  activeAnchor: LandingPreviewAnchor | null;
  content: LandingCoachingPreviewContent;
  highlightVisible?: boolean;
  seal: LandingProblemSolutionSeal;
  sealStamped: boolean;
};

export function CoachingLandingPreview({
  activeAnchor,
  content,
  highlightVisible = activeAnchor !== null,
  seal,
  sealStamped,
}: CoachingLandingPreviewProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  usePreviewAnchorFrame(trackRef, overlayRef, activeAnchor);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay) {
      return;
    }

    overlay.dataset.active =
      highlightVisible && activeAnchor !== null ? "true" : "false";
  }, [activeAnchor, highlightVisible]);

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

          <ApprovalSeal
            ariaLabel={seal.ariaLabel}
            brand={seal.brand}
            stamped={sealStamped}
          />
        </div>
      </div>
    </div>
  );
}
