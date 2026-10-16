"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { FeedbackRoundStepKind } from "@/common/constants/portal/feedback-round-step-kinds";
import { PortalFeedbackQueryParam } from "@/common/constants/portal/portal-feedback-query-params";
import type { FeedbackRoundStepEntry } from "@/common/contracts/portal/feedback-round-step-entry";
import { usePortalStepSearch } from "./use-portal-step-search";

/**
 * The feedback round shown, as URL state (`?round=<number>`). Only rounds that were handed over
 * can be opened; anything else shows `initial`. After a change the new round starts at the top of
 * the scroll area with the focus on its heading.
 */
export function useFeedbackRoundNavigation(
  entries: readonly FeedbackRoundStepEntry[],
  initial: number | null,
) {
  const { search, push, synchronized } = usePortalStepSearch(
    PortalFeedbackQueryParam.Round,
    undefined,
    true,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectable = useMemo(
    () =>
      entries
        .filter((entry) => entry.kind === FeedbackRoundStepKind.Round)
        .map((entry) => entry.roundNumber),
    [entries],
  );
  const requested = Number(
    new URLSearchParams(search).get(PortalFeedbackQueryParam.Round),
  );
  const current = selectable.includes(requested) ? requested : initial;
  const previousRoundRef = useRef(current);
  const index = current === null ? -1 : selectable.indexOf(current);

  useEffect(() => {
    if (!synchronized || previousRoundRef.current === current) return;
    previousRoundRef.current = current;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    headingRef.current?.focus();
  }, [current, synchronized]);

  const goTo = useCallback(
    (roundNumber: number) => {
      if (!selectable.includes(roundNumber) || roundNumber === current) return;
      push((params) =>
        params.set(PortalFeedbackQueryParam.Round, String(roundNumber)),
      );
    },
    [current, push, selectable],
  );

  return {
    current,
    previous: index > 0 ? selectable[index - 1] : null,
    next:
      index >= 0 && index < selectable.length - 1
        ? selectable[index + 1]
        : null,
    goTo,
    /** The scroll area of the page; a new round starts at its top. */
    bodyRef,
    /** The heading of the round shown; it takes the focus after a change. */
    headingRef,
  };
}
