import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
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
