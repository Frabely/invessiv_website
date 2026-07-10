import {
  HERO_ZOOM_BACKDROP_FADE_RANGE,
  HERO_ZOOM_CHROME_FADE_RANGE,
  HERO_ZOOM_FRAME_RADIUS_PX,
  HERO_ZOOM_HANDOFF_MARGIN_PX,
  HERO_ZOOM_HERO_FADE_RANGE,
  type HeroZoomProgressRange,
} from "@/common/constants";
import type {
  HeroZoomFrameStyle,
  HeroZoomMeasurements,
} from "@/common/contracts";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

function fadeOutOverRange(progress: number, range: HeroZoomProgressRange) {
  return 1 - clamp01((progress - range.start) / (range.end - range.start));
}

/**
 * Scroll-Position, an der der Zoom abgeschlossen ist und `#solution` (direkt unter
 * der Replik-Hero im Frame) mit `HERO_ZOOM_HANDOFF_MARGIN_PX` Abstand unter der
 * Viewport-Oberkante steht. Der Transform ist hier exakt Identität → nahtloser
 * Handoff an natives Scrollen.
 */
export function computeHeroZoomEndScroll(measurements: HeroZoomMeasurements) {
  return Math.max(
    1,
    measurements.frameTop +
      measurements.replicaHeight -
      HERO_ZOOM_HANDOFF_MARGIN_PX,
  );
}

export function computeHeroZoomProgress(scrollY: number, endScroll: number) {
  if (endScroll <= 0) {
    return 1;
  }

  return clamp01(scrollY / endScroll);
}

export function computeHeroZoomFrameStyle(
  measurements: HeroZoomMeasurements,
  scrollY: number,
): HeroZoomFrameStyle {
  const {
    viewportHeight,
    frameTop,
    frameLeft,
    frameWidth,
    frameHeight,
    replicaHeight,
    placeholderTop,
    placeholderLeft,
    placeholderWidth,
    placeholderHeight,
  } = measurements;

  const endScroll = computeHeroZoomEndScroll(measurements);
  const progress = computeHeroZoomProgress(scrollY, endScroll);
  const eased = easeInOutCubic(progress);

  const initialScale = placeholderWidth / frameWidth;
  const scale = initialScale + (1 - initialScale) * eased;

  const targetX = placeholderLeft + (frameLeft - placeholderLeft) * eased;
  const finalTop = HERO_ZOOM_HANDOFF_MARGIN_PX - replicaHeight;
  const targetY = placeholderTop + (finalTop - placeholderTop) * eased;

  const translateX = targetX - frameLeft;
  const translateY = targetY - (frameTop - scrollY);

  const initialVisibleLocalHeight = placeholderHeight / initialScale;
  const finalVisibleLocalHeight =
    viewportHeight + replicaHeight - HERO_ZOOM_HANDOFF_MARGIN_PX;
  const visibleLocalHeight =
    initialVisibleLocalHeight +
    (finalVisibleLocalHeight - initialVisibleLocalHeight) * eased;

  const clipBottomPx = Math.max(0, frameHeight - visibleLocalHeight);
  const clipRadiusPx = (HERO_ZOOM_FRAME_RADIUS_PX * (1 - eased)) / scale;

  return {
    translateX,
    translateY,
    scale,
    clipBottomPx,
    clipRadiusPx,
    chromeLeftPx: targetX,
    chromeTopPx: targetY,
    chromeWidthPx: frameWidth * scale,
    chromeHeightPx: Math.min(visibleLocalHeight, frameHeight) * scale,
    chromeRadiusPx: clipRadiusPx * scale,
    chromeOpacity: fadeOutOverRange(progress, HERO_ZOOM_CHROME_FADE_RANGE),
    heroOpacity: fadeOutOverRange(progress, HERO_ZOOM_HERO_FADE_RANGE),
    backdropOpacity: fadeOutOverRange(progress, HERO_ZOOM_BACKDROP_FADE_RANGE),
  };
}
