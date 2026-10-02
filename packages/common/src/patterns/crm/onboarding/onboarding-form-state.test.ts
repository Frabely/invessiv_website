import { describe, expect, it } from "vitest";
import { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";
import {
  ONBOARDING_FORM_STATUS_VALUES,
  OnboardingFormStatus,
} from "../../../constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "../../../constants/crm/onboarding/onboarding-transition-sides";
import { PROJECT_STATUS_VALUES } from "../../../constants/crm/project-statuses";
import {
  canTransitionOnboardingForm,
  isOnboardingProjectEligible,
  isOnboardingReviewOpen,
  isOnboardingStructureEditable,
  listCustomerEditableOnboardingBlockIds,
} from "./onboarding-form-state";

describe("isOnboardingStructureEditable", () => {
  it("allows structure changes until the first submission", () => {
    expect(
      ONBOARDING_FORM_STATUS_VALUES.filter(isOnboardingStructureEditable),
    ).toEqual(["draft", "open"]);
  });
});

describe("isOnboardingReviewOpen", () => {
  it("opens the review only while the form lies with the team", () => {
    expect(
      ONBOARDING_FORM_STATUS_VALUES.filter(isOnboardingReviewOpen),
    ).toEqual(["submitted"]);
  });
});

describe("isOnboardingProjectEligible", () => {
  it("lets only planned and active projects start an onboarding", () => {
    expect(PROJECT_STATUS_VALUES.filter(isOnboardingProjectEligible)).toEqual([
      "planned",
      "active",
    ]);
  });
});

describe("canTransitionOnboardingForm", () => {
  it("lets the customer submit an open form and a change request, nothing else", () => {
    const customerOrigins = ONBOARDING_FORM_STATUS_VALUES.filter((status) =>
      canTransitionOnboardingForm(
        status,
        OnboardingFormStatus.Submitted,
        OnboardingTransitionSide.Customer,
      ),
    );
    expect(customerOrigins).toEqual(["open", "changes_requested"]);
  });

  it("keeps internal steps away from the customer", () => {
    expect(
      canTransitionOnboardingForm(
        OnboardingFormStatus.Draft,
        OnboardingFormStatus.Open,
        OnboardingTransitionSide.Customer,
      ),
    ).toBe(false);
    expect(
      canTransitionOnboardingForm(
        OnboardingFormStatus.Draft,
        OnboardingFormStatus.Open,
        OnboardingTransitionSide.Internal,
      ),
    ).toBe(true);
  });
});

describe("listCustomerEditableOnboardingBlockIds", () => {
  const pending = {
    blockId: "pending",
    reviewStatus: OnboardingBlockReviewStatus.Pending,
    clarificationMode: null,
  };
  const forCustomer = {
    blockId: "customer",
    reviewStatus: OnboardingBlockReviewStatus.Clarification,
    clarificationMode: OnboardingClarificationMode.Customer,
  };
  const forCall = {
    blockId: "call",
    reviewStatus: OnboardingBlockReviewStatus.Clarification,
    clarificationMode: OnboardingClarificationMode.Call,
  };
  const blocks = [pending, forCustomer, forCall];

  it("opens every block of an open form", () => {
    expect(
      listCustomerEditableOnboardingBlockIds(OnboardingFormStatus.Open, blocks),
    ).toEqual(["pending", "customer", "call"]);
  });

  it("opens only blocks handed back to the customer during a change request", () => {
    expect(
      listCustomerEditableOnboardingBlockIds(
        OnboardingFormStatus.ChangesRequested,
        blocks,
      ),
    ).toEqual(["customer"]);
  });

  it.each([
    OnboardingFormStatus.Draft,
    OnboardingFormStatus.Submitted,
    OnboardingFormStatus.Completed,
  ])("opens nothing while the form is %s", (status) => {
    expect(listCustomerEditableOnboardingBlockIds(status, blocks)).toEqual([]);
  });
});
