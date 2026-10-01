import { describe, expect, it } from "vitest";
import {
  PORTAL_ONBOARDING_ERROR_CODE_VALUES,
  PortalOnboardingErrorCode,
} from "../../portal/portal-onboarding-error-codes";
import {
  ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
  OnboardingBlockReviewStatus,
} from "./onboarding-block-review-statuses";
import {
  ONBOARDING_CLARIFICATION_MODE_VALUES,
  OnboardingClarificationMode,
} from "./onboarding-clarification-modes";
import { PROJECT_LINE_ITEM_STATUS_VALUES } from "../project-line-item-statuses";
import { ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES } from "./onboarding-eligible-project-statuses";
import {
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES,
  ONBOARDING_FORM_STATUS_VALUES,
  ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
  ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES,
  ONBOARDING_SUBMITTED_STATUS_VALUES,
  OnboardingFormStatus,
} from "./onboarding-form-statuses";
import { ONBOARDING_FORM_TRANSITIONS } from "./onboarding-form-transitions";
import { ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES } from "./onboarding-visible-line-item-statuses";
import {
  ONBOARDING_TRANSITION_SIDE_VALUES,
  OnboardingTransitionSide,
} from "./onboarding-transition-sides";

describe("onboarding const objects", () => {
  it.each([
    [OnboardingFormStatus, ONBOARDING_FORM_STATUS_VALUES],
    [OnboardingTransitionSide, ONBOARDING_TRANSITION_SIDE_VALUES],
    [OnboardingBlockReviewStatus, ONBOARDING_BLOCK_REVIEW_STATUS_VALUES],
    [OnboardingClarificationMode, ONBOARDING_CLARIFICATION_MODE_VALUES],
    [PortalOnboardingErrorCode, PORTAL_ONBOARDING_ERROR_CODE_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("onboarding form statuses", () => {
  it("never leaves completed", () => {
    const origins: readonly OnboardingFormStatus[] =
      ONBOARDING_FORM_TRANSITIONS.map((transition) => transition.from);
    expect(origins).not.toContain(OnboardingFormStatus.Completed);
  });

  it("reaches every status except the initial draft", () => {
    const targets = new Set(
      ONBOARDING_FORM_TRANSITIONS.map((transition) => transition.to),
    );
    expect(targets).toEqual(
      new Set(
        ONBOARDING_FORM_STATUS_VALUES.filter(
          (status) => status !== OnboardingFormStatus.Draft,
        ),
      ),
    );
  });

  it("lets the customer move only out of editable statuses", () => {
    for (const transition of ONBOARDING_FORM_TRANSITIONS) {
      if (transition.side !== OnboardingTransitionSide.Customer) continue;
      expect(ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES).toContain(
        transition.from,
      );
    }
  });

  it("hides only the draft from the portal", () => {
    expect(ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES).toEqual(
      ONBOARDING_FORM_STATUS_VALUES.filter(
        (status) => status !== OnboardingFormStatus.Draft,
      ),
    );
  });

  it("treats every status after the first submission as submitted", () => {
    expect(ONBOARDING_SUBMITTED_STATUS_VALUES).toEqual([
      "submitted",
      "changes_requested",
      "completed",
    ]);
  });

  it("allows structure changes only before the first submission", () => {
    expect(ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES).toEqual([
      "draft",
      "open",
    ]);
  });
});

describe("onboarding project rules", () => {
  it("starts an onboarding only for planned and active projects", () => {
    expect(ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES).toEqual([
      "planned",
      "active",
    ]);
  });

  it("shows every booked service except rejected ones", () => {
    expect(ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES).toEqual(
      PROJECT_LINE_ITEM_STATUS_VALUES.filter((status) => status !== "rejected"),
    );
  });
});
