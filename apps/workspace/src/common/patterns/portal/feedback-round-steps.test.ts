import { describe, expect, it } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { FeedbackQuotaDto } from "@invessiv/common/contracts/crm/feedback-quota.dto";
import {
  initialFeedbackRoundNumber,
  listFeedbackRoundSteps,
} from "./feedback-round-steps";

function round(roundNumber: number, status: FeedbackRoundStatus) {
  return {
    id: `round-${roundNumber}`,
    roundNumber,
    status,
    previewUrl: null,
    handoverNote: null,
    dueOn: null,
    areaOptions: [],
    draftUpdatedAt: null,
    draftUpdatedByName: null,
    submittedAt: null,
    customerNotice: null,
    completedAt: null,
    approvedAt: null,
    items: [],
    version: 1,
  } satisfies PortalFeedbackRoundDto;
}

function quota(overrides: Partial<FeedbackQuotaDto>): FeedbackQuotaDto {
  return {
    included: 3,
    used: 0,
    remaining: 3,
    activeRoundNumber: null,
    approvedRoundNumber: null,
    ...overrides,
  };
}

describe("listFeedbackRoundSteps", () => {
  it("lists past, running and upcoming rounds of the quota in order", () => {
    const feedback = {
      activeRound: round(2, FeedbackRoundStatus.Open),
      history: [round(1, FeedbackRoundStatus.Completed)],
      quota: quota({ used: 2, remaining: 1, activeRoundNumber: 2 }),
    };

    expect(
      listFeedbackRoundSteps(feedback).map((entry) => [
        entry.roundNumber,
        entry.kind,
        entry.round?.id ?? null,
      ]),
    ).toEqual([
      [1, "round", "round-1"],
      [2, "round", "round-2"],
      [3, "upcoming", null],
    ]);
    expect(initialFeedbackRoundNumber(feedback)).toBe(2);
  });

  it("expires the rounds after an approval and opens on the newest round", () => {
    const feedback = {
      activeRound: null,
      history: [
        round(2, FeedbackRoundStatus.Approved),
        round(1, FeedbackRoundStatus.Completed),
      ],
      quota: quota({ used: 2, remaining: 0, approvedRoundNumber: 2 }),
    };

    expect(listFeedbackRoundSteps(feedback).map((entry) => entry.kind)).toEqual(
      ["round", "round", "expired"],
    );
    expect(initialFeedbackRoundNumber(feedback)).toBe(2);
  });

  it("keeps an extra round past the quota and has no start before a handover", () => {
    expect(
      listFeedbackRoundSteps({
        activeRound: round(3, FeedbackRoundStatus.Open),
        history: [],
        quota: quota({ included: 2, used: 3, remaining: 0 }),
      }).map((entry) => entry.roundNumber),
    ).toEqual([1, 2, 3]);
    const none = { activeRound: null, history: [], quota: quota({}) };
    expect(listFeedbackRoundSteps(none).map((entry) => entry.kind)).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(initialFeedbackRoundNumber(none)).toBeNull();
  });
});
