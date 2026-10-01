import { describe, expect, it } from "vitest";

import { PortalOnboardingApiPath } from "./portal-onboarding-api-paths";
import { PortalOnboardingEvent } from "./portal-onboarding-events";
import {
  PORTAL_ONBOARDING_REVIEW_SECTION,
  PortalOnboardingQueryParam,
} from "./portal-onboarding-query-params";

function expectUnique(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length);
}

describe("portal onboarding constants", () => {
  it("names the path segments of the onboarding routes", () => {
    expect(PortalOnboardingApiPath).toEqual({
      Onboarding: "onboarding",
      Answers: "answers",
      Submit: "submit",
    });
    expectUnique(Object.values(PortalOnboardingApiPath));
  });

  it("names the query params of the form page and its review step", () => {
    expect(PortalOnboardingQueryParam).toEqual({
      Section: "section",
      Field: "field",
      Locale: "locale",
    });
    expectUnique(Object.values(PortalOnboardingQueryParam));
    expect(PORTAL_ONBOARDING_REVIEW_SECTION).toBe("review");
  });

  it("names the step event", () => {
    expect(PortalOnboardingEvent).toEqual({
      StepChanged: "portal:onboarding-step-changed",
    });
  });
});
