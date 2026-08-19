"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import type {
  LandingCoachingPreviewContent,
  LandingProblemSolutionContent,
} from "@/common/contracts/marketing";
import { CoachingLandingPreview } from "@/components/marketing/landing/coaching-landing-preview/coaching-landing-preview";
import { ProblemSolutionSection } from "@/components/marketing/landing/problem-solution-section/problem-solution-section";
import type { Locale } from "@/config/i18n";
import { useElementInView } from "@/hooks/marketing/use-element-in-view";
import { useMediaQuery } from "@/hooks/marketing/use-media-query";
import styles from "./landing-visual-stage.module.css";

/** Mirrors the `max-width: 900px` block in problem-solution-section.module.css. */
const TAP_TOGGLE_MEDIA_QUERY =
  "(max-width: 900px), (hover: none) and (pointer: coarse)";

type LandingVisualStageProps = {
  hero: ReactNode;
  locale: Locale;
  preview: LandingCoachingPreviewContent;
  problemSolution: LandingProblemSolutionContent;
  solutionSectionId: string;
};

/**
 * Keeps the demo visible across the hero and problem-solution section.
 * Owns the active anchor shared by the list and preview. Pointer devices drive
 * it by hover; the mobile layout reveals the focused demo directly below the
 * tapped pair instead of splitting the viewport between controls and result.
 */
export function LandingVisualStage({
  hero,
  locale,
  preview,
  problemSolution,
  solutionSectionId,
}: LandingVisualStageProps) {
  const problemSlotRef = useRef<HTMLDivElement | null>(null);
  const [focusedAnchor, setFocusedAnchor] =
    useState<LandingPreviewAnchor | null>(null);
  const [ambientAnchor, setAmbientAnchor] =
    useState<LandingPreviewAnchor | null>(null);
  const [selectedAnchor, setSelectedAnchor] =
    useState<LandingPreviewAnchor | null>(null);
  const [mobilePreviewHost, setMobilePreviewHost] =
    useState<HTMLDivElement | null>(null);
  const usesTapToggle = useMediaQuery(TAP_TOGGLE_MEDIA_QUERY);
  const tapSelection = usesTapToggle ? selectedAnchor : null;
  const activeAnchor = usesTapToggle
    ? tapSelection
    : (ambientAnchor ?? focusedAnchor);
  const isProblemSectionInView = useElementInView(
    problemSlotRef,
    "0px 0px -50%",
  );
  const visibleAnchor = isProblemSectionInView ? activeAnchor : null;
  const rowActiveAnchor = usesTapToggle ? tapSelection : visibleAnchor;

  const toggleSelectedAnchor = useCallback((anchor: LandingPreviewAnchor) => {
    setMobilePreviewHost(null);
    setSelectedAnchor((current) => (current === anchor ? null : anchor));
  }, []);

  const previewElement = (
    <CoachingLandingPreview
      activeAnchor={activeAnchor}
      content={preview}
      highlightVisible={
        usesTapToggle ? tapSelection !== null : visibleAnchor !== null
      }
    />
  );

  return (
    <div className={styles.stage}>
      <div className={styles.heroSlot}>{hero}</div>

      <div className={styles.problemSlot} ref={problemSlotRef}>
        <ProblemSolutionSection
          {...problemSolution}
          activeAnchor={rowActiveAnchor}
          id={solutionSectionId}
          locale={locale}
          onAnchorAmbient={setAmbientAnchor}
          onAnchorFocus={setFocusedAnchor}
          onAnchorToggle={toggleSelectedAnchor}
          onMobilePreviewHostChange={setMobilePreviewHost}
          selectedAnchor={tapSelection}
          usesTapToggle={usesTapToggle}
        />
      </div>

      {usesTapToggle && mobilePreviewHost ? (
        createPortal(previewElement, mobilePreviewHost)
      ) : (
        <div className={styles.visualLayer}>
          <div className={styles.visualRail}>
            <div className={styles.visualSticky}>{previewElement}</div>
          </div>
        </div>
      )}
    </div>
  );
}
