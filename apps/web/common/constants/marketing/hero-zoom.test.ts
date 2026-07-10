import { describe, expect, it } from "vitest";

import {
  HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO,
  HERO_ZOOM_BACKDROP_FADE_RANGE,
  HERO_ZOOM_FRAME_RADIUS_PX,
  HERO_ZOOM_HANDOFF_MARGIN_PX,
  HERO_ZOOM_HERO_FADE_RANGE,
  HERO_ZOOM_PLACEHOLDER_ATTRIBUTE,
  HERO_ZOOM_REPIN_PROGRESS,
  HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
  HERO_ZOOM_STATE,
} from "./hero-zoom";

describe("hero zoom constants", () => {
  it("exposes the stable zoom state values", () => {
    expect(HERO_ZOOM_STATE).toEqual({
      Pending: "pending",
      Idle: "idle",
      Pinned: "pinned",
      Native: "native",
    });
  });

  it("keeps the stage state attribute stable for CSS selectors", () => {
    expect(HERO_ZOOM_STAGE_STATE_ATTRIBUTE).toBe("data-zoom-state");
  });

  it("keeps the placeholder marker attribute stable for layout queries", () => {
    expect(HERO_ZOOM_PLACEHOLDER_ATTRIBUTE).toBe("data-hero-zoom-placeholder");
  });

  it("keeps the handoff margin positive so #solution has room above it", () => {
    expect(HERO_ZOOM_HANDOFF_MARGIN_PX).toBeGreaterThan(0);
  });

  it("keeps the re-pin threshold below full progress", () => {
    expect(HERO_ZOOM_REPIN_PROGRESS).toBeLessThan(1);
    expect(HERO_ZOOM_REPIN_PROGRESS).toBeGreaterThan(0.9);
  });

  it("orders the fade ranges within progress bounds", () => {
    expect(HERO_ZOOM_HERO_FADE_RANGE.start).toBeLessThan(
      HERO_ZOOM_HERO_FADE_RANGE.end,
    );
    expect(HERO_ZOOM_BACKDROP_FADE_RANGE.start).toBeLessThan(
      HERO_ZOOM_BACKDROP_FADE_RANGE.end,
    );
    expect(HERO_ZOOM_HERO_FADE_RANGE.end).toBeLessThanOrEqual(
      HERO_ZOOM_BACKDROP_FADE_RANGE.end,
    );
    expect(HERO_ZOOM_BACKDROP_FADE_RANGE.end).toBeLessThan(1);
  });

  it("uses positive geometry defaults", () => {
    expect(HERO_ZOOM_FRAME_RADIUS_PX).toBeGreaterThan(0);
    expect(HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO).toBeGreaterThan(0);
    expect(HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO).toBeLessThanOrEqual(1);
  });
});
