import { describe, expect, it } from "vitest";

import { OnboardingBlockReviewStatus as S } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode as M } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

const { review, requestChanges } = onboardingFormSchemas;

describe("onboardingFormSchemas.review", () => {
  it("accepts pending and complete without a question", () => {
    for (const reviewStatus of [S.Pending, S.Complete])
      expect(review.parse({ reviewStatus, expectedVersion: 1 })).toEqual({
        reviewStatus,
        expectedVersion: 1,
      });
  });

  it("accepts a question with its way and trims the text", () => {
    expect(
      review.parse({
        reviewStatus: S.Clarification,
        clarificationMode: M.Customer,
        note: "  Welche Domain?  ",
        expectedVersion: 2,
      }),
    ).toMatchObject({ clarificationMode: M.Customer, note: "Welche Domain?" });
  });

  it("refuses a question without its way or without text", () => {
    const question = {
      reviewStatus: S.Clarification,
      clarificationMode: M.Call,
      note: "Bitte klären",
      expectedVersion: 1,
    };
    for (const input of [
      { ...question, clarificationMode: undefined },
      { ...question, clarificationMode: "mail" },
      { ...question, note: undefined },
      { ...question, note: "   " },
      { ...question, note: "x".repeat(QUESTIONNAIRE_LIMITS.noteMaxLength + 1) },
    ])
      expect(review.safeParse(input).success).toBe(false);
  });

  it("refuses a question on a block that is pending or complete", () => {
    for (const reviewStatus of [S.Pending, S.Complete])
      for (const extra of [{ note: "Hinweis" }, { clarificationMode: M.Call }])
        expect(
          review.safeParse({ reviewStatus, expectedVersion: 1, ...extra })
            .success,
        ).toBe(false);
  });

  it("refuses an unknown status and a missing or invalid version", () => {
    for (const input of [
      { reviewStatus: "done", expectedVersion: 1 },
      { reviewStatus: S.Complete },
      { reviewStatus: S.Complete, expectedVersion: 0 },
    ])
      expect(review.safeParse(input).success).toBe(false);
  });
});

describe("onboardingFormSchemas.requestChanges", () => {
  it("takes the form version and nothing else", () => {
    expect(requestChanges.safeParse({ expectedVersion: 3 }).success).toBe(true);
    for (const input of [
      {},
      { expectedVersion: 0 },
      { expectedVersion: 3, x: 1 },
    ])
      expect(requestChanges.safeParse(input).success).toBe(false);
  });
});
