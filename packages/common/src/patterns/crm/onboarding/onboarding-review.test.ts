import { describe, expect, it } from "vitest";
import { OnboardingBlockReviewStatus as S } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode as M } from "../../../constants/crm/onboarding/onboarding-clarification-modes";
import {
  listOnboardingClarificationBlocks,
  summarizeOnboardingReview,
} from "./onboarding-review";

const pending = { reviewStatus: S.Pending, clarificationMode: null };
const complete = { reviewStatus: S.Complete, clarificationMode: null };
const forCustomer = {
  reviewStatus: S.Clarification,
  clarificationMode: M.Customer,
};
const forCall = { reviewStatus: S.Clarification, clarificationMode: M.Call };

describe("summarizeOnboardingReview", () => {
  it("counts nothing for a form without blocks", () => {
    expect(summarizeOnboardingReview([])).toEqual({
      total: 0,
      reviewed: 0,
      clarifications: 0,
      customerClarifications: 0,
      callClarifications: 0,
    });
  });

  it("counts a clarification as reviewed and splits the questions by their way", () => {
    expect(
      summarizeOnboardingReview([
        pending,
        complete,
        forCustomer,
        forCall,
        forCall,
      ]),
    ).toEqual({
      total: 5,
      reviewed: 4,
      clarifications: 3,
      customerClarifications: 1,
      callClarifications: 2,
    });
  });
});

describe("listOnboardingClarificationBlocks", () => {
  const blocks = [
    { id: "a", ...pending },
    { id: "b", ...forCall },
    { id: "c", ...complete },
    { id: "d", ...forCustomer },
    { id: "e", ...forCall },
  ];

  it("keeps the form order and only the blocks of the asked way", () => {
    expect(
      listOnboardingClarificationBlocks(blocks, M.Call).map(({ id }) => id),
    ).toEqual(["b", "e"]);
    expect(
      listOnboardingClarificationBlocks(blocks, M.Customer).map(({ id }) => id),
    ).toEqual(["d"]);
  });
});
