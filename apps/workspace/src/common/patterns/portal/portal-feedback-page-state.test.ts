import { describe, expect, it } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackQuotaDto } from "@invessiv/common/contracts/crm/feedback-quota.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import {
  PORTAL_FEEDBACK_PAGE_STATE_VALUES,
  PortalFeedbackPageState,
} from "@/common/constants/portal/portal-feedback-page-states";
import { portalFeedbackPageState } from "@/common/patterns/portal/portal-feedback-page-state";

const QUOTA: FeedbackQuotaDto = {
  included: 2,
  used: 0,
  remaining: 2,
  activeRoundNumber: null,
  approvedRoundNumber: null,
};

function round(status: FeedbackRoundStatus): PortalFeedbackRoundDto {
  return { status } as PortalFeedbackRoundDto;
}

describe("portalFeedbackPageState", () => {
  it("lists every state exactly once", () => {
    expect([...PORTAL_FEEDBACK_PAGE_STATE_VALUES]).toEqual(
      Object.values(PortalFeedbackPageState),
    );
  });

  it("offers the sheet only to a contact who may submit", () => {
    const active = round(FeedbackRoundStatus.Open);
    expect(
      portalFeedbackPageState({
        activeRound: active,
        quota: QUOTA,
        canSubmit: true,
      }),
    ).toBe(PortalFeedbackPageState.Sheet);
    expect(
      portalFeedbackPageState({
        activeRound: active,
        quota: QUOTA,
        canSubmit: false,
      }),
    ).toBe(PortalFeedbackPageState.OpenReadOnly);
  });

  it("tells a submitted round apart from one the team works on", () => {
    expect(
      portalFeedbackPageState({
        activeRound: round(FeedbackRoundStatus.Submitted),
        quota: QUOTA,
        canSubmit: true,
      }),
    ).toBe(PortalFeedbackPageState.Submitted);
    expect(
      portalFeedbackPageState({
        activeRound: round(FeedbackRoundStatus.InProgress),
        quota: QUOTA,
        canSubmit: true,
      }),
    ).toBe(PortalFeedbackPageState.Working);
  });

  it("distinguishes no round yet, between rounds, all used and approved", () => {
    const state = (quota: Partial<FeedbackQuotaDto>) =>
      portalFeedbackPageState({
        activeRound: null,
        quota: { ...QUOTA, ...quota },
        canSubmit: true,
      });
    expect(state({})).toBe(PortalFeedbackPageState.None);
    expect(state({ used: 1, remaining: 1 })).toBe(
      PortalFeedbackPageState.Between,
    );
    expect(state({ used: 2, remaining: 0 })).toBe(
      PortalFeedbackPageState.Exhausted,
    );
    expect(state({ used: 1, remaining: 0, approvedRoundNumber: 1 })).toBe(
      PortalFeedbackPageState.Approved,
    );
  });
});
