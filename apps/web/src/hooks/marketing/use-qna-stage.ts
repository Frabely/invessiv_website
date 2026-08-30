"use client";

import type { RefObject } from "react";
import { useCallback, useEffect } from "react";

import {
  QNA_STAGE_PHASE,
  type QnaStagePhase,
} from "@/common/constants/marketing/qna-stage-phase";
import { useStickyScrollProgress } from "./use-sticky-scroll-progress";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const HANDOVER_PROGRESS = 0.37;
const BOARD_PROGRESS = 0.58;

function resolvePhase(progress: number): QnaStagePhase {
  if (progress < HANDOVER_PROGRESS) {
    return QNA_STAGE_PHASE.Question;
  }

  if (progress < BOARD_PROGRESS) {
    return QNA_STAGE_PHASE.Handover;
  }

  return QNA_STAGE_PHASE.Board;
}

type QnaStageOptions = {
  sectionRef: RefObject<HTMLElement | null>;
};

/**
 * Drives the scroll choreography of the Q&A section. The markup ships the
 * finished board, so the intro phases only run once this hook opts the section
 * in via `data-qna-animated`.
 */
export function useQnaStage({ sectionRef }: QnaStageOptions) {
  const handleProgress = useCallback(
    (progress: number) => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const phase = resolvePhase(progress);

      if (section.dataset.qnaPhase !== phase) {
        section.dataset.qnaPhase = phase;
      }

      section.style.setProperty("--qna-stage-progress", progress.toFixed(3));
    },
    [sectionRef],
  );

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof window.matchMedia !== "function") {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);

    const syncAnimatedState = () => {
      if (reducedMotionMedia.matches) {
        delete section.dataset.qnaAnimated;
        section.dataset.qnaPhase = QNA_STAGE_PHASE.Board;
        return;
      }

      section.dataset.qnaAnimated = "true";
    };

    syncAnimatedState();
    reducedMotionMedia.addEventListener("change", syncAnimatedState);

    return () => {
      reducedMotionMedia.removeEventListener("change", syncAnimatedState);
      delete section.dataset.qnaAnimated;
    };
  }, [sectionRef]);

  useStickyScrollProgress({
    trackRef: sectionRef,
    onProgressAction: handleProgress,
  });
}
