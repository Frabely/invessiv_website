import { describe, expect, it } from "vitest";

import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";

describe("formatMessage", () => {
  it("replaces known placeholders and keeps unknown ones visible", () => {
    expect(
      formatMessage("{count} of {max} {unit}", { count: 3, max: 10 }),
    ).toBe("3 of 10 {unit}");
  });
});
