"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";

/**
 * Stamps a submitted round as read once it has been shown. Opening never changes the status; a
 * failure stays silent because the stamp only feeds the inbox. A fresh stamp refreshes the page, so
 * the sidebar counter and the round list drop the "new" marker.
 */
export function useMarkFeedbackRoundRead(
  round: Pick<FeedbackRoundDto, "id" | "readAt" | "status" | "version">,
) {
  const router = useRouter();
  const requestedFor = useRef<string | null>(null);
  const shouldMark =
    round.readAt === null && round.status !== FeedbackRoundStatus.Open;

  useEffect(() => {
    if (!shouldMark || requestedFor.current === round.id) return;
    requestedFor.current = round.id;
    void feedbackRoundsApiService
      .markRead(round.id, { version: round.version })
      .then((marked) => {
        if (marked) router.refresh();
      });
  }, [round.id, round.version, router, shouldMark]);
}
