import { describe, expect, it } from "vitest";

import { DRAFT_AUTOSAVE_DELAY_MS } from "./draft-autosave-delay";

describe("DRAFT_AUTOSAVE_DELAY_MS", () => {
  it("rests longer than a keystroke and shorter than a few seconds", () => {
    expect(DRAFT_AUTOSAVE_DELAY_MS).toBe(1_500);
  });
});
