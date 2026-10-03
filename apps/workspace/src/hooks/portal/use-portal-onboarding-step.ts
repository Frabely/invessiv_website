"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PortalOnboardingEvent } from "@/common/constants/portal/portal-onboarding-events";
import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import type { PortalOnboardingStepTarget } from "@/common/contracts/portal/portal-onboarding-step-target";
import { buildPortalOnboardingStepSearch } from "@/common/patterns/portal/portal-onboarding-path";

function subscribeToUrlChanges(onChange: () => void) {
  window.addEventListener(PortalOnboardingEvent.StepChanged, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(PortalOnboardingEvent.StepChanged, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function currentSearch() {
  return window.location.search.slice(1);
}

/**
 * The step of a form as URL state, so a reload and the back button land where the customer was.
 * A step change writes the history without a server round trip: the form holds its answers
 * locally, a re-render from the server would only be discarded. An unknown step is the first
 * one, or `initialSection` where the form should open elsewhere.
 */
export function usePortalOnboardingStep(
  sections: readonly string[],
  initialSection: string = sections[0],
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useSyncExternalStore(
    subscribeToUrlChanges,
    currentSearch,
    () => searchParams.toString(),
  );
  const params = new URLSearchParams(search);
  const requested = params.get(PortalOnboardingQueryParam.Section);
  const known = requested !== null && sections.includes(requested);

  const goTo = useCallback(
    (target: PortalOnboardingStepTarget) => {
      const params = new URLSearchParams(window.location.search);
      params.delete(PortalOnboardingQueryParam.Section);
      params.delete(PortalOnboardingQueryParam.Field);
      for (const [key, value] of new URLSearchParams(
        buildPortalOnboardingStepSearch(target),
      )) {
        params.set(key, value);
      }
      const query = params.toString();
      window.history.pushState(
        null,
        "",
        `${pathname}${query ? `?${query}` : ""}`,
      );
      window.dispatchEvent(new Event(PortalOnboardingEvent.StepChanged));
    },
    [pathname],
  );

  return {
    section: known ? requested : initialSection,
    /** Field to focus after a jump; only meaningful together with its own step. */
    fieldId: known ? params.get(PortalOnboardingQueryParam.Field) : null,
    goTo,
  };
}
