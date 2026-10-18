"use client";

import { useCallback, useState } from "react";
import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import type { PortalOnboardingStepTarget } from "@/common/contracts/portal/portal-onboarding-step-target";
import { buildPortalOnboardingStepSearch } from "@/common/patterns/portal/portal-onboarding-path";
import { usePortalStepSearch } from "./use-portal-step-search";

/**
 * The step of a form as URL state, so a reload and the back button land where the customer was.
 * An unknown step is the first one, or `initialSection` where the form should open elsewhere.
 */
export function usePortalOnboardingStep(
  sections: readonly string[],
  initialSection: string = sections[0],
) {
  const { search, push } = usePortalStepSearch(
    PortalOnboardingQueryParam.Section,
    PortalOnboardingQueryParam.Field,
  );
  const params = new URLSearchParams(search);
  const requested = params.get(PortalOnboardingQueryParam.Section);
  const known = requested !== null && sections.includes(requested);
  const section = known ? requested : initialSection;
  const [history, setHistory] = useState(() => ({
    section,
    leftSections: new Set<string>(),
  }));
  if (history.section !== section) {
    setHistory({
      section,
      leftSections: new Set([...history.leftSections, history.section]),
    });
  }

  const goTo = useCallback(
    (target: PortalOnboardingStepTarget) => {
      push((params) => {
        params.delete(PortalOnboardingQueryParam.Section);
        params.delete(PortalOnboardingQueryParam.Field);
        for (const [key, value] of new URLSearchParams(
          buildPortalOnboardingStepSearch(target),
        )) {
          params.set(key, value);
        }
      });
    },
    [push],
  );

  return {
    section,
    /** Sections visited and left during this editor session, even without answering a question. */
    leftSections: history.leftSections,
    /** Field to focus after a jump; only meaningful together with its own step. */
    fieldId: known ? params.get(PortalOnboardingQueryParam.Field) : null,
    goTo,
  };
}
