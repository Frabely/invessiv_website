"use client";

import type { RefObject } from "react";
import { useEffect, useLayoutEffect } from "react";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import {
  HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO,
  HERO_ZOOM_HANDOFF_MARGIN_PX,
  HERO_ZOOM_PLACEHOLDER_ATTRIBUTE,
  HERO_ZOOM_REPIN_PROGRESS,
  HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
  HERO_ZOOM_STATE,
  type HeroZoomState,
} from "@/common/constants/marketing";
import type { HeroZoomMeasurements } from "@/common/contracts/marketing";
import { HERO_SECTION_ID } from "@/config/navigation/home";
import { LANDING_SECTION_IDS } from "@/config/navigation/landing";
import {
  computeHeroZoomEndScroll,
  computeHeroZoomFrameStyle,
  computeHeroZoomProgress,
} from "@/common/patterns/marketing/hero-zoom-geometry";
import {
  getLayoutDocumentLeft,
  getLayoutDocumentTop,
} from "@/lib/navigation/anchor-scroll";

const HERO_FADE_VARIABLE = "--hero-zoom-hero-fade";
const BACKDROP_FADE_VARIABLE = "--hero-zoom-backdrop-fade";
const CHROME_LEFT_VARIABLE = "--hero-zoom-chrome-x";
const CHROME_TOP_VARIABLE = "--hero-zoom-chrome-y";
const CHROME_SCALE_X_VARIABLE = "--hero-zoom-chrome-scale-x";
const CHROME_SCALE_Y_VARIABLE = "--hero-zoom-chrome-scale-y";
const CHROME_RADIUS_X_VARIABLE = "--hero-zoom-chrome-radius-x";
const CHROME_RADIUS_Y_VARIABLE = "--hero-zoom-chrome-radius-y";
const CHROME_OPACITY_VARIABLE = "--hero-zoom-chrome-opacity";
const HERO_ZOOM_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: no-preference)";
const HERO_ZOOM_MOBILE_MEDIA_QUERY = "(max-width: 900px)";
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type UseHeroZoomRefs = {
  stageRef: RefObject<HTMLDivElement | null>;
  heroPinRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
};

function dispatchZoomState(state: HeroZoomState) {
  window.dispatchEvent(
    new CustomEvent(LANDING_HERO_ZOOM_STATE_EVENT, {
      detail: { state },
    }),
  );
}

function clearFrameStyles(frame: HTMLElement) {
  frame.style.transform = "";
  frame.style.clipPath = "";
  frame.style.willChange = "";
  frame.removeAttribute("inert");
}

function clearFadeVariables(stage: HTMLElement) {
  stage.style.removeProperty(HERO_FADE_VARIABLE);
  stage.style.removeProperty(BACKDROP_FADE_VARIABLE);
}

function clearChromeVariables(stage: HTMLElement) {
  stage.style.removeProperty(CHROME_LEFT_VARIABLE);
  stage.style.removeProperty(CHROME_TOP_VARIABLE);
  stage.style.removeProperty(CHROME_SCALE_X_VARIABLE);
  stage.style.removeProperty(CHROME_SCALE_Y_VARIABLE);
  stage.style.removeProperty(CHROME_RADIUS_X_VARIABLE);
  stage.style.removeProperty(CHROME_RADIUS_Y_VARIABLE);
  stage.style.removeProperty(CHROME_OPACITY_VARIABLE);
}

function clearHeroZoomInlineStyles({
  frame,
  heroPin,
  stage,
}: {
  frame: HTMLElement;
  heroPin: HTMLElement;
  stage: HTMLElement;
}) {
  clearFrameStyles(frame);
  clearFadeVariables(stage);
  clearChromeVariables(stage);
  heroPin.style.visibility = "";
}

function applyHeroZoomFrameStyle({
  frame,
  measurements,
  stage,
}: {
  frame: HTMLElement;
  measurements: HeroZoomMeasurements;
  stage: HTMLElement;
}) {
  const style = computeHeroZoomFrameStyle(measurements, window.scrollY);
  const chromeScaleX = style.chromeWidthPx / window.innerWidth;
  const chromeScaleY = style.chromeHeightPx / window.innerHeight;

  frame.style.transform = `translate3d(${style.translateX}px, ${style.translateY}px, 0) scale(${style.scale})`;
  frame.style.clipPath = `inset(0 0 ${style.clipBottomPx}px 0 round 0 0 ${style.clipRadiusPx}px ${style.clipRadiusPx}px)`;
  stage.style.setProperty(HERO_FADE_VARIABLE, `${style.heroOpacity}`);
  stage.style.setProperty(BACKDROP_FADE_VARIABLE, `${style.backdropOpacity}`);
  stage.style.setProperty(CHROME_LEFT_VARIABLE, `${style.chromeLeftPx}px`);
  stage.style.setProperty(CHROME_TOP_VARIABLE, `${style.chromeTopPx}px`);
  stage.style.setProperty(CHROME_SCALE_X_VARIABLE, `${chromeScaleX}`);
  stage.style.setProperty(CHROME_SCALE_Y_VARIABLE, `${chromeScaleY}`);
  stage.style.setProperty(
    CHROME_RADIUS_X_VARIABLE,
    `${chromeScaleX > 0 ? style.chromeRadiusPx / chromeScaleX : 0}px`,
  );
  stage.style.setProperty(
    CHROME_RADIUS_Y_VARIABLE,
    `${chromeScaleY > 0 ? style.chromeRadiusPx / chromeScaleY : 0}px`,
  );
  stage.style.setProperty(CHROME_OPACITY_VARIABLE, `${style.chromeOpacity}`);
}

function measureHeroZoomLayout({
  frame,
  stage,
}: {
  frame: HTMLElement;
  stage: HTMLElement;
}): HeroZoomMeasurements | null {
  const placeholder = stage.querySelector(
    `[${HERO_ZOOM_PLACEHOLDER_ATTRIBUTE}]`,
  );
  const target = document.getElementById(LANDING_SECTION_IDS.solution);

  if (
    !(placeholder instanceof HTMLElement) ||
    !(target instanceof HTMLElement) ||
    !frame.contains(target)
  ) {
    return null;
  }

  const rect = placeholder.getBoundingClientRect();
  const frameWidth = frame.offsetWidth;

  if (frameWidth <= 0 || rect.width <= 0) {
    return null;
  }

  const frameTop = getLayoutDocumentTop(frame);

  return {
    viewportHeight: window.innerHeight,
    frameTop,
    frameLeft: getLayoutDocumentLeft(frame),
    frameWidth,
    frameHeight: frame.offsetHeight,
    targetTop: getLayoutDocumentTop(target) - frameTop,
    handoffMarginPx: HERO_ZOOM_HANDOFF_MARGIN_PX,
    placeholderTop: rect.top,
    placeholderLeft: rect.left,
    placeholderWidth: rect.width,
    placeholderHeight: rect.height,
  };
}

export function useHeroZoom({
  stageRef,
  heroPinRef,
  frameRef,
}: UseHeroZoomRefs) {
  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    const heroPin = heroPinRef.current;
    const frame = frameRef.current;

    if (!stage || !heroPin || !frame) {
      return;
    }

    let currentState: HeroZoomState = HERO_ZOOM_STATE.Pending;
    let measurements: HeroZoomMeasurements | null = null;
    let renderFrameId = 0;
    let activationFrameId = 0;
    const cleanups: Array<() => void> = [];

    const transition = (next: HeroZoomState) => {
      if (currentState === next) {
        return;
      }

      currentState = next;
      stage.setAttribute(HERO_ZOOM_STAGE_STATE_ATTRIBUTE, next);
      dispatchZoomState(next);
    };

    const enterIdle = () => {
      clearHeroZoomInlineStyles({ frame, heroPin, stage });
      heroPin.style.visibility = "";
      transition(HERO_ZOOM_STATE.Idle);
    };

    const enterNative = () => {
      clearFrameStyles(frame);
      clearChromeVariables(stage);
      heroPin.style.visibility = "hidden";
      stage.style.setProperty(HERO_FADE_VARIABLE, "0");
      stage.style.setProperty(BACKDROP_FADE_VARIABLE, "0");
      transition(HERO_ZOOM_STATE.Native);
    };

    const applyPinned = () => {
      if (!measurements) {
        return;
      }

      if (currentState !== HERO_ZOOM_STATE.Pinned) {
        frame.style.willChange = "transform";
        frame.setAttribute("inert", "");
        heroPin.style.visibility = "";
        transition(HERO_ZOOM_STATE.Pinned);
      }

      applyHeroZoomFrameStyle({ frame, measurements, stage });
    };

    const render = () => {
      renderFrameId = 0;

      if (!measurements) {
        return;
      }

      const endScroll = computeHeroZoomEndScroll(measurements);
      const progress = computeHeroZoomProgress(window.scrollY, endScroll);

      if (progress >= 1) {
        enterNative();
        return;
      }

      if (
        currentState === HERO_ZOOM_STATE.Native &&
        progress >= HERO_ZOOM_REPIN_PROGRESS
      ) {
        return;
      }

      applyPinned();
    };

    const scheduleRender = () => {
      if (!renderFrameId) {
        renderFrameId = window.requestAnimationFrame(render);
      }
    };

    const canActivate = () => {
      if (typeof window.matchMedia !== "function") {
        return false;
      }

      if (window.matchMedia(HERO_ZOOM_MOBILE_MEDIA_QUERY).matches) {
        return false;
      }

      if (!window.matchMedia(HERO_ZOOM_MOTION_MEDIA_QUERY).matches) {
        return false;
      }

      const hash = window.location.hash;
      if (hash !== "" && hash !== `#${HERO_SECTION_ID}`) {
        return false;
      }

      return (
        window.scrollY <=
        window.innerHeight * HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO
      );
    };

    const activate = () => {
      activationFrameId = 0;

      if (!canActivate()) {
        enterIdle();
        return;
      }

      stage.setAttribute(
        HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
        HERO_ZOOM_STATE.Pinned,
      );
      measurements = measureHeroZoomLayout({ frame, stage });

      if (!measurements) {
        enterIdle();
        return;
      }

      render();

      const handleScroll = () => scheduleRender();
      const handleResize = () => {
        measurements = measureHeroZoomLayout({ frame, stage });
        scheduleRender();
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
      cleanups.push(() => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      });

      if (typeof ResizeObserver === "function") {
        const observer = new ResizeObserver(handleResize);
        observer.observe(frame);
        cleanups.push(() => observer.disconnect());
      }

      const media = window.matchMedia(HERO_ZOOM_MOTION_MEDIA_QUERY);
      const handleMediaChange = () => {
        if (!media.matches) {
          for (const cleanup of cleanups.splice(0)) {
            cleanup();
          }
          enterIdle();
        }
      };

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handleMediaChange);
        cleanups.push(() =>
          media.removeEventListener("change", handleMediaChange),
        );
      }
    };

    activationFrameId = window.requestAnimationFrame(activate);

    return () => {
      if (activationFrameId) {
        window.cancelAnimationFrame(activationFrameId);
      }
      if (renderFrameId) {
        window.cancelAnimationFrame(renderFrameId);
      }
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      clearHeroZoomInlineStyles({ frame, heroPin, stage });
    };
  }, [frameRef, heroPinRef, stageRef]);
}
