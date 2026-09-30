import { describe, expect, it } from "vitest";

import { buildPortalFeedbackPath } from "@/common/patterns/portal/portal-feedback-path";

describe("buildPortalFeedbackPath", () => {
  it("builds the localized feedback page of one project", () => {
    expect(
      buildPortalFeedbackPath({
        locale: "de",
        customerId: "customer-1",
        projectId: "project-1",
      }),
    ).toBe("/de/portal/customer-1/projects/project-1/feedback");
    expect(
      buildPortalFeedbackPath({
        locale: "en",
        customerId: "customer-1",
        projectId: "project-1",
      }),
    ).toBe("/en/portal/customer-1/projects/project-1/feedback");
  });

  it("encodes the ids as single path segments", () => {
    expect(
      buildPortalFeedbackPath({
        locale: "de",
        customerId: "a/b",
        projectId: "c d",
      }),
    ).toBe("/de/portal/a%2Fb/projects/c%20d/feedback");
  });
});
