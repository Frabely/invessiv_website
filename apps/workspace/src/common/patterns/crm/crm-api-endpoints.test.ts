import { describe, expect, it } from "vitest";

import {
  crmFeedbackRoundEndpoint,
  crmProjectFeedbackRoundsEndpoint,
} from "./crm-api-endpoints";

describe("crm feedback round endpoints", () => {
  it("builds the round list below the project and the detail below the round api", () => {
    expect(crmProjectFeedbackRoundsEndpoint("p-1")).toBe(
      "/api/workspace/crm/projects/p-1/feedback-rounds",
    );
    expect(crmFeedbackRoundEndpoint("r-1")).toBe(
      "/api/workspace/crm/feedback-rounds/r-1",
    );
  });

  it("encodes the ids", () => {
    expect(crmProjectFeedbackRoundsEndpoint("a/b")).toBe(
      "/api/workspace/crm/projects/a%2Fb/feedback-rounds",
    );
    expect(crmFeedbackRoundEndpoint("c d")).toBe(
      "/api/workspace/crm/feedback-rounds/c%20d",
    );
  });
});
