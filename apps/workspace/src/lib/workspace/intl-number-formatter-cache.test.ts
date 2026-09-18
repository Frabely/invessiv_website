import { describe, expect, it } from "vitest";

import { createNumberFormatterCache } from "@/lib/workspace/intl-number-formatter-cache";

describe("createNumberFormatterCache", () => {
  it("reuses the same formatter instance for repeated calls with the same locale", () => {
    const getFormatter = createNumberFormatterCache();

    expect(getFormatter("de")).toBe(getFormatter("de"));
  });

  it("creates a separate formatter per locale", () => {
    const getFormatter = createNumberFormatterCache();

    expect(getFormatter("de")).not.toBe(getFormatter("en"));
  });

  it("applies the given options to every formatter it creates", () => {
    const getFormatter = createNumberFormatterCache({
      style: "currency",
      currency: "EUR",
    });

    expect(getFormatter("de").format(1500)).toBe("1.500,00 €");
  });
});
