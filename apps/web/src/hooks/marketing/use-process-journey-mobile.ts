"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import {
  PROCESS_JOURNEY_MOBILE_QUERY,
  PROCESS_JOURNEY_STATES,
} from "@/common/constants/marketing/process-journey";
import { useMediaQuery } from "@/hooks/marketing/use-media-query";

type UseProcessJourneyMobileParams = {
  endCtaRef: RefObject<HTMLAnchorElement | null>;
  stepsRef: RefObject<HTMLDivElement | null>;
};

// Root is the lower half of the viewport, so the observer wakes up whenever a
// target crosses the middle -- the reading line the states are derived from.
const READING_LINE_ROOT_MARGIN = "-50% 0px 0px 0px";

export function useProcessJourneyMobile({
  endCtaRef,
  stepsRef,
}: UseProcessJourneyMobileParams) {
  const isMobileJourney = useMediaQuery(PROCESS_JOURNEY_MOBILE_QUERY);

  useEffect(() => {
    const steps = stepsRef.current;
    if (!steps || !isMobileJourney || !("IntersectionObserver" in window)) {
      return;
    }
    const cards = Array.from(
      steps.querySelectorAll<HTMLElement>("[data-process-step='true']"),
    );
    if (cards.length === 0) {
      return;
    }
    const endCta = endCtaRef.current;
    // The CTA is the last stop of the journey: once it reaches the reading
    // line every step is done and the button takes over.
    const targets: HTMLElement[] = endCta ? [...cards, endCta] : cards;
    let lastActiveIndex: number | null = null;

    const applyJourneyStates = () => {
      // Reading the rects here costs nothing during scrolling: the observer
      // only fires around a crossing, never per frame.
      const readingLineY = window.innerHeight / 2;
      let activeIndex = 0;
      targets.forEach((target, index) => {
        if (target.getBoundingClientRect().top < readingLineY) {
          activeIndex = index;
        }
      });
      if (activeIndex === lastActiveIndex) {
        return;
      }
      lastActiveIndex = activeIndex;
      cards.forEach((card, index) => {
        const state =
          index < activeIndex
            ? PROCESS_JOURNEY_STATES.passed
            : index === activeIndex
              ? PROCESS_JOURNEY_STATES.active
              : PROCESS_JOURNEY_STATES.upcoming;
        if (card.dataset.journeyState !== state) {
          card.dataset.journeyState = state;
        }
      });
      if (endCta) {
        endCta.dataset.journeyActive =
          activeIndex >= cards.length ? "true" : "false";
      }
    };

    const observer = new IntersectionObserver(applyJourneyStates, {
      rootMargin: READING_LINE_ROOT_MARGIN,
      threshold: 0,
    });
    targets.forEach((target) => observer.observe(target));

    // A fling can carry a target across the line between two frames, which the
    // observer never sees. Re-reading once the scroll settles repairs that.
    const supportsScrollEnd = "onscrollend" in window;
    if (supportsScrollEnd) {
      window.addEventListener("scrollend", applyJourneyStates);
    }

    return () => {
      observer.disconnect();
      if (supportsScrollEnd) {
        window.removeEventListener("scrollend", applyJourneyStates);
      }
      cards.forEach((card) => {
        delete card.dataset.journeyState;
      });
      if (endCta) {
        endCta.dataset.journeyActive = "false";
      }
    };
  }, [endCtaRef, isMobileJourney, stepsRef]);
}
