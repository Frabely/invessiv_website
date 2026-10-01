import { describe, expect, it } from "vitest";
import { ONBOARDING_FORM_STATUS_VALUES } from "../../../constants/crm/onboarding/onboarding-form-statuses";
import { PROJECT_STATUS_VALUES } from "../../../constants/crm/project-statuses";
import {
  isOnboardingProjectEligible,
  isOnboardingStructureEditable,
} from "./onboarding-form-state";

describe("isOnboardingStructureEditable", () => {
  it("allows structure changes until the first submission", () => {
    expect(
      ONBOARDING_FORM_STATUS_VALUES.filter(isOnboardingStructureEditable),
    ).toEqual(["draft", "open"]);
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
