import { describe, expect, it } from "vitest";

import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "./onboarding-form-activity-metadata";

describe("onboarding form activity metadata", () => {
  it("marks activities with a stable entity name", () => {
    expect(ONBOARDING_FORM_ACTIVITY_ENTITY).toBe("onboarding_form");
  });
});
