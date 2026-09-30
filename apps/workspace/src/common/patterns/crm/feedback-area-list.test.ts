import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackAreaRejection } from "@/common/constants/crm/forms/feedback-area-rejections";
import { addFeedbackArea } from "./feedback-area-list";

describe("addFeedbackArea", () => {
  it("appends a trimmed area", () => {
    expect(addFeedbackArea(["Start"], "  Über uns ")).toEqual({
      ok: true,
      areas: ["Start", "Über uns"],
    });
  });

  it.each([
    ["   ", FeedbackAreaRejection.Empty],
    [
      "x".repeat(FEEDBACK_LIMITS.areaLabelMaxLength + 1),
      FeedbackAreaRejection.TooLong,
    ],
    ["Start", FeedbackAreaRejection.Duplicate],
  ])("rejects %j", (candidate, rejection) => {
    expect(addFeedbackArea(["Start"], candidate)).toEqual({
      ok: false,
      rejection,
    });
  });

  it("stops at the area limit", () => {
    const full = Array.from(
      { length: FEEDBACK_LIMITS.areasPerProject },
      (_, index) => `Seite ${index}`,
    );
    expect(addFeedbackArea(full, "Noch eine")).toEqual({
      ok: false,
      rejection: FeedbackAreaRejection.LimitReached,
    });
  });
});
