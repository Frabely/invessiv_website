import { describe, expect, it } from "vitest";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";

const templates = {
  none: "Keine Runde.",
  one: "1 Runde.",
  many: "{count} Runden.",
};

describe("formatCountMessage", () => {
  it("picks the template for none, one and many", () => {
    expect(formatCountMessage(0, templates)).toBe("Keine Runde.");
    expect(formatCountMessage(1, templates)).toBe("1 Runde.");
    expect(formatCountMessage(3, templates)).toBe("3 Runden.");
  });

  it("uses the many template for zero without a none template", () => {
    expect(
      formatCountMessage(0, { one: "1 Runde.", many: "{count} Runden." }),
    ).toBe("0 Runden.");
  });
});
