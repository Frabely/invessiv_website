"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

import { setupProcessJourney } from "@/lib/process/process-journey";

type UseProcessJourneyParams = {
  locale: string;
  processDotRef: RefObject<SVGCircleElement | null>;
  processPathRef: RefObject<SVGPathElement | null>;
  processSectionRef: RefObject<HTMLElement | null>;
  processStepsRef: RefObject<HTMLDivElement | null>;
};

export function useProcessJourney({
  locale,
  processDotRef,
  processPathRef,
  processSectionRef,
  processStepsRef,
}: UseProcessJourneyParams) {
  useEffect(() => {
    const section = processSectionRef.current;
    const stepsContainer = processStepsRef.current;
    const path = processPathRef.current;
    const dot = processDotRef.current;

    if (!section || !stepsContainer || !path || !dot) {
      return;
    }

    const stepCards = Array.from(
      section.querySelectorAll<HTMLElement>(".process-step"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    const cleanup = setupProcessJourney({
      dot,
      isMobile,
      path,
      reducedMotion,
      section,
      stepsContainer,
      stepCards,
    });

    return cleanup;
  }, [
    locale,
    processDotRef,
    processPathRef,
    processSectionRef,
    processStepsRef,
  ]);
}
