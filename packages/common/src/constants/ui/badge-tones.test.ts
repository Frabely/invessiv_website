import { describe, expect, it } from "vitest";
import { BADGE_TONE_VALUES, BadgeTone } from "./badge-tones";

describe("BadgeTone", () => {
  it("contains the expected tones without duplicates", () => {
    expect(BADGE_TONE_VALUES).toEqual([
      BadgeTone.Danger,
      BadgeTone.Indigo,
      BadgeTone.Info,
      BadgeTone.Neutral,
      BadgeTone.Primary,
      BadgeTone.Purple,
      BadgeTone.Success,
      BadgeTone.Orange,
      BadgeTone.Warning,
      BadgeTone.Teal,
      BadgeTone.Lime,
      BadgeTone.Fuchsia,
      BadgeTone.Coral,
      BadgeTone.Pink,
      BadgeTone.Magenta,
    ]);
    expect(new Set(BADGE_TONE_VALUES).size).toBe(BADGE_TONE_VALUES.length);
  });
});
