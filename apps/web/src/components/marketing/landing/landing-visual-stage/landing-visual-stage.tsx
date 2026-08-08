"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

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
const TAP_TOGGLE_MEDIA_QUERY = "(max-width: 900px)";

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
 * it by hover only; the mobile layout switches to a tap toggle instead.
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
  const [hoveredAnchor, setHoveredAnchor] =
    useState<LandingPreviewAnchor | null>(null);
  const [selectedAnchor, setSelectedAnchor] =
    useState<LandingPreviewAnchor | null>(null);
  const usesTapToggle = useMediaQuery(TAP_TOGGLE_MEDIA_QUERY);
  const tapSelection = usesTapToggle ? selectedAnchor : null;
  const activeAnchor = tapSelection ?? hoveredAnchor ?? focusedAnchor;
  const isProblemSectionInView = useElementInView(
    problemSlotRef,
    "0px 0px -50%",
  );
  const visibleAnchor = isProblemSectionInView ? activeAnchor : null;

  const toggleSelectedAnchor = useCallback((anchor: LandingPreviewAnchor) => {
    setSelectedAnchor((current) => (current === anchor ? null : anchor));
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.heroSlot}>{hero}</div>

      <div className={styles.problemSlot} ref={problemSlotRef}>
        <ProblemSolutionSection
          {...problemSolution}
          activeAnchor={visibleAnchor}
          id={solutionSectionId}
          locale={locale}
          onAnchorFocus={setFocusedAnchor}
          onAnchorHover={setHoveredAnchor}
          onAnchorToggle={toggleSelectedAnchor}
          selectedAnchor={tapSelection}
          usesTapToggle={usesTapToggle}
        />
      </div>

      <div className={styles.visualLayer}>
        <div className={styles.visualRail}>
          <div className={styles.visualSticky}>
            <CoachingLandingPreview
              activeAnchor={activeAnchor}
              content={preview}
              highlightVisible={visibleAnchor !== null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
