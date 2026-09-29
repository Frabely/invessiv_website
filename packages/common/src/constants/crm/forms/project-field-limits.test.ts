import { describe, expect, it } from "vitest";

import { ProjectFieldLimits } from "@invessiv/common/constants/crm/forms/project-field-limits";

describe("ProjectFieldLimits", () => {
  it("mirrors the projects columns", () => {
    expect(ProjectFieldLimits).toEqual({
      ProcessStepMaxLength: 80,
      ProcessStepsMaxCount: 30,
      FeedbackRoundsMax: 20,
      DefaultFeedbackRoundCount: 2,
    });
  });
});
