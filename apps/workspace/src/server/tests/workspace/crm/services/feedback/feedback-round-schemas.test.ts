import { describe, expect, it } from "vitest";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { businessToday } from "@/common/patterns/time/business-today";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";

const parse = (input: object) => feedbackRoundSchemas.handOver.safeParse(input);

describe("feedbackRoundSchemas.handOver", () => {
  it("trims and nulls empty optional texts", () => {
    const parsed = feedbackRoundSchemas.handOver.parse({
      areaOptions: [" Startseite "],
      previewUrl: "  ",
      handoverNote: "  Neu  ",
      dueOn: businessToday(),
    });
    expect(parsed).toEqual({
      areaOptions: ["Startseite"],
      previewUrl: null,
      handoverNote: "Neu",
      dueOn: businessToday(),
    });
  });

  it("accepts only HTTPS previews within the length limit", () => {
    expect(
      parse({ areaOptions: [], previewUrl: "https://a.example" }).success,
    ).toBe(true);
    expect(
      parse({ areaOptions: [], previewUrl: "http://a.example" }).success,
    ).toBe(false);
    expect(
      parse({
        areaOptions: [],
        previewUrl: `https://a.example/${"x".repeat(FEEDBACK_LIMITS.previewUrlMaxLength)}`,
      }).success,
    ).toBe(false);
  });

  it("rejects a due day in the past", () => {
    expect(parse({ areaOptions: [], dueOn: "2000-01-01" }).success).toBe(false);
  });

  it("limits the areas in number, length and uniqueness", () => {
    const areas = Array.from(
      { length: FEEDBACK_LIMITS.areasPerProject + 1 },
      (_, index) => `Seite ${index}`,
    );
    expect(parse({ areaOptions: areas.slice(0, -1) }).success).toBe(true);
    expect(parse({ areaOptions: areas }).success).toBe(false);
    expect(parse({ areaOptions: ["A", "A"] }).success).toBe(false);
    expect(
      parse({
        areaOptions: ["x".repeat(FEEDBACK_LIMITS.areaLabelMaxLength + 1)],
      }).success,
    ).toBe(false);
    expect(parse({ areaOptions: [], customerId: "x" }).success).toBe(false);
  });
});

describe("feedbackRoundSchemas.changeStatus", () => {
  const parse = (input: object) =>
    feedbackRoundSchemas.changeStatus.safeParse(input);

  it("keeps an optional call notice trimmed and nulls an empty one", () => {
    expect(
      feedbackRoundSchemas.changeStatus.parse({
        version: 3,
        to: FeedbackRoundStatus.InDiscussion,
        customerNotice: "  Donnerstag?  ",
      }),
    ).toEqual({
      version: 3,
      to: FeedbackRoundStatus.InDiscussion,
      customerNotice: "Donnerstag?",
    });
    expect(
      feedbackRoundSchemas.changeStatus.parse({
        version: 3,
        to: FeedbackRoundStatus.InDiscussion,
        customerNotice: "   ",
      }),
    ).toMatchObject({ customerNotice: null });
  });

  it("requires a notice for the handback and refuses one elsewhere", () => {
    const open = { version: 3, to: FeedbackRoundStatus.Open };
    expect(parse(open).success).toBe(false);
    expect(parse({ ...open, customerNotice: "  " }).success).toBe(false);
    expect(parse({ ...open, customerNotice: "Bitte ergänzen" }).success).toBe(
      true,
    );
    expect(
      parse({
        version: 3,
        to: FeedbackRoundStatus.Completed,
        customerNotice: "Fertig",
      }).success,
    ).toBe(false);
    expect(
      parse({ version: 3, to: FeedbackRoundStatus.InProgress }).success,
    ).toBe(true);
  });

  it("refuses customer targets, long notices and a missing version", () => {
    expect(
      parse({ version: 3, to: FeedbackRoundStatus.Approved }).success,
    ).toBe(false);
    expect(
      parse({
        version: 3,
        to: FeedbackRoundStatus.Open,
        customerNotice: "x".repeat(FEEDBACK_LIMITS.noteMaxLength + 1),
      }).success,
    ).toBe(false);
    expect(parse({ to: FeedbackRoundStatus.InProgress }).success).toBe(false);
  });
});

describe("feedbackRoundSchemas.setItemResult", () => {
  const parse = (input: object) =>
    feedbackRoundSchemas.setItemResult.safeParse(input);

  it("demands a reply for results the customer is owed an explanation for", () => {
    for (const result of [
      FeedbackItemResult.NotImplemented,
      FeedbackItemResult.AdditionalService,
    ]) {
      expect(parse({ version: 1, result }).success).toBe(false);
      expect(parse({ version: 1, result, resultNote: " " }).success).toBe(
        false,
      );
      expect(parse({ version: 1, result, resultNote: "Weil …" }).success).toBe(
        true,
      );
    }
    expect(
      parse({ version: 1, result: FeedbackItemResult.Implemented }).success,
    ).toBe(true);
  });

  it("refuses unknown results and replies beyond the limit", () => {
    expect(parse({ version: 1, result: "done" }).success).toBe(false);
    expect(
      parse({
        version: 1,
        result: FeedbackItemResult.NotImplemented,
        resultNote: "x".repeat(FEEDBACK_LIMITS.noteMaxLength + 1),
      }).success,
    ).toBe(false);
  });
});
