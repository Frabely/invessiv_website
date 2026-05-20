import { describe, expect, it } from "vitest";

import { getNextTheme } from "./theme";

describe("theme helpers", () => {
  it("returns the typed next theme for both supported themes", () => {
    expect(getNextTheme("dark")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
  });
});
