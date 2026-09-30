import { describe, expect, it } from "vitest";
import { FeedbackHandoverValidationCode } from "@/common/constants/crm/forms/feedback-handover-validation-codes";
import {
  createFeedbackHandoverValues,
  toHandOverRequest,
  validateFeedbackHandover,
} from "./feedback-handover-form";

const TODAY = "2026-09-30";

describe("feedback handover form", () => {
  it("starts from the given preview and areas", () => {
    expect(
      createFeedbackHandoverValues({
        previewUrl: "https://preview.example.com",
        areaOptions: ["Startseite"],
      }),
    ).toEqual({
      previewUrl: "https://preview.example.com",
      handoverNote: "",
      dueOn: "",
      areaOptions: ["Startseite"],
    });
  });

  it("accepts an empty form and a valid one", () => {
    const empty = createFeedbackHandoverValues({
      previewUrl: null,
      areaOptions: [],
    });
    expect(validateFeedbackHandover(empty, TODAY)).toEqual({});
    expect(
      validateFeedbackHandover(
        { ...empty, previewUrl: "https://a.example", dueOn: TODAY },
        TODAY,
      ),
    ).toEqual({});
  });

  it("flags an insecure preview and a past due day", () => {
    expect(
      validateFeedbackHandover(
        {
          previewUrl: "http://a.example",
          handoverNote: "",
          dueOn: "2026-09-29",
          areaOptions: [],
        },
        TODAY,
      ),
    ).toEqual({
      previewUrl: FeedbackHandoverValidationCode.PreviewUrlInvalid,
      dueOn: FeedbackHandoverValidationCode.DueOnPast,
    });
  });

  it("sends empty fields as null and trims texts", () => {
    expect(
      toHandOverRequest({
        previewUrl: "  ",
        handoverNote: "  Neue Startseite ",
        dueOn: "",
        areaOptions: ["Start"],
      }),
    ).toEqual({
      previewUrl: null,
      handoverNote: "Neue Startseite",
      dueOn: null,
      areaOptions: ["Start"],
    });
  });
});
