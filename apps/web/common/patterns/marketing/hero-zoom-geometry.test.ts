import { describe, expect, it } from "vitest";

import {
  HERO_ZOOM_FRAME_RADIUS_PX,
  HERO_ZOOM_HANDOFF_MARGIN_PX,
} from "../../constants/marketing/hero-zoom";
import type { HeroZoomMeasurements } from "../../contracts/marketing/hero-zoom-geometry";

import {
  computeHeroZoomEndScroll,
  computeHeroZoomFrameStyle,
  computeHeroZoomProgress,
} from "./hero-zoom-geometry";

const MEASUREMENTS: HeroZoomMeasurements = {
  viewportHeight: 900,
  frameTop: 1300,
  frameLeft: 0,
  frameWidth: 1440,
  frameHeight: 9800,
  replicaHeight: 900,
  placeholderTop: 220,
  placeholderLeft: 860,
  placeholderWidth: 432,
  placeholderHeight: 300,
};

const END_SCROLL = computeHeroZoomEndScroll(MEASUREMENTS);

describe("computeHeroZoomEndScroll", () => {
  it("ends the zoom one handoff margin before exact alignment", () => {
    expect(END_SCROLL).toBe(
      MEASUREMENTS.frameTop +
        MEASUREMENTS.replicaHeight -
        HERO_ZOOM_HANDOFF_MARGIN_PX,
    );
  });
});

describe("computeHeroZoomProgress", () => {
  it("clamps progress into [0, 1]", () => {
    expect(computeHeroZoomProgress(-50, END_SCROLL)).toBe(0);
    expect(computeHeroZoomProgress(0, END_SCROLL)).toBe(0);
    expect(computeHeroZoomProgress(END_SCROLL / 2, END_SCROLL)).toBeCloseTo(
      0.5,
    );
    expect(computeHeroZoomProgress(END_SCROLL, END_SCROLL)).toBe(1);
    expect(computeHeroZoomProgress(END_SCROLL + 500, END_SCROLL)).toBe(1);
  });
});

describe("computeHeroZoomFrameStyle", () => {
  it("places the frame exactly into the placeholder rect at progress 0", () => {
    const style = computeHeroZoomFrameStyle(MEASUREMENTS, 0);
    const initialScale =
      MEASUREMENTS.placeholderWidth / MEASUREMENTS.frameWidth;

    expect(style.scale).toBeCloseTo(initialScale);
    expect(style.translateX).toBeCloseTo(
      MEASUREMENTS.placeholderLeft - MEASUREMENTS.frameLeft,
    );
    expect(style.translateY).toBeCloseTo(
      MEASUREMENTS.placeholderTop - MEASUREMENTS.frameTop,
    );

    const visibleLocalHeight = MEASUREMENTS.frameHeight - style.clipBottomPx;
    expect(visibleLocalHeight * initialScale).toBeCloseTo(
      MEASUREMENTS.placeholderHeight,
    );
    expect(style.clipRadiusPx * initialScale).toBeCloseTo(
      HERO_ZOOM_FRAME_RADIUS_PX,
    );
    expect(style.heroOpacity).toBe(1);
    expect(style.backdropOpacity).toBe(1);
  });

  it("reaches the exact identity transform at progress 1", () => {
    const style = computeHeroZoomFrameStyle(MEASUREMENTS, END_SCROLL);

    expect(style.scale).toBeCloseTo(1);
    expect(style.translateX).toBeCloseTo(0);
    expect(style.translateY).toBeCloseTo(0);
    expect(style.clipRadiusPx).toBeCloseTo(0);
    expect(style.heroOpacity).toBe(0);
    expect(style.backdropOpacity).toBe(0);
  });

  it("clips the frame bottom exactly at the viewport bottom at progress 1", () => {
    const style = computeHeroZoomFrameStyle(MEASUREMENTS, END_SCROLL);

    const frameVisualTop = MEASUREMENTS.frameTop - END_SCROLL;
    const visibleLocalHeight = MEASUREMENTS.frameHeight - style.clipBottomPx;
    const visualBottom = frameVisualTop + visibleLocalHeight * style.scale;

    expect(visualBottom).toBeCloseTo(MEASUREMENTS.viewportHeight);
  });

  it("keeps intermediate values monotone between the endpoints", () => {
    const quarter = computeHeroZoomFrameStyle(MEASUREMENTS, END_SCROLL * 0.25);
    const half = computeHeroZoomFrameStyle(MEASUREMENTS, END_SCROLL * 0.5);
    const threeQuarters = computeHeroZoomFrameStyle(
      MEASUREMENTS,
      END_SCROLL * 0.75,
    );
    const initialScale =
      MEASUREMENTS.placeholderWidth / MEASUREMENTS.frameWidth;

    expect(quarter.scale).toBeGreaterThan(initialScale);
    expect(half.scale).toBeGreaterThan(quarter.scale);
    expect(threeQuarters.scale).toBeGreaterThan(half.scale);
    expect(threeQuarters.scale).toBeLessThan(1);
    expect(quarter.heroOpacity).toBe(1);
    expect(threeQuarters.heroOpacity).toBeLessThan(1);
  });

  it("never returns a negative clip inset", () => {
    const shallowFrame: HeroZoomMeasurements = {
      ...MEASUREMENTS,
      frameHeight: 700,
    };

    const style = computeHeroZoomFrameStyle(
      shallowFrame,
      computeHeroZoomEndScroll(shallowFrame),
    );

    expect(style.clipBottomPx).toBeGreaterThanOrEqual(0);
  });
});
