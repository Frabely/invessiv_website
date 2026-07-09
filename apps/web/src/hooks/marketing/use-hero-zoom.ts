"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import {
  DESKTOP_FINE_POINTER_MOTION_MEDIA_QUERY,
  HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO,
  HERO_ZOOM_PLACEHOLDER_ATTRIBUTE,
  HERO_ZOOM_REPIN_PROGRESS,
  HERO_ZOOM_REPLICA_ATTRIBUTE,
  HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
  HERO_ZOOM_STATE,
  type HeroZoomState,
} from "@/common/constants/marketing";
import type { HeroZoomMeasurements } from "@/common/contracts/marketing";
import { HERO_SECTION_ID } from "@/config/navigation/home";
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

type UseHeroZoomRefs = {
  stageRef: RefObject<HTMLDivElement | null>;
  heroPinRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
};

export function useHeroZoom({
  stageRef,
  heroPinRef,
  frameRef,
}: UseHeroZoomRefs) {
  useEffect(() => {
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
      window.dispatchEvent(
        new CustomEvent(LANDING_HERO_ZOOM_STATE_EVENT, {
          detail: { state: next },
        }),
      );
    };

    const clearFrameStyles = () => {
      frame.style.transform = "";
      frame.style.clipPath = "";
      frame.style.willChange = "";
      frame.removeAttribute("inert");
    };

    const clearFadeVariables = () => {
      stage.style.removeProperty(HERO_FADE_VARIABLE);
      stage.style.removeProperty(BACKDROP_FADE_VARIABLE);
    };

    const enterIdle = () => {
      clearFrameStyles();
      clearFadeVariables();
      heroPin.style.visibility = "";
      transition(HERO_ZOOM_STATE.Idle);
    };

    const enterNative = () => {
      clearFrameStyles();
      heroPin.style.visibility = "hidden";
      stage.style.setProperty(HERO_FADE_VARIABLE, "0");
      stage.style.setProperty(BACKDROP_FADE_VARIABLE, "0");
      transition(HERO_ZOOM_STATE.Native);
    };

    const applyPinned = () => {
      if (!measurements) {
        return;
      }

      const style = computeHeroZoomFrameStyle(measurements, window.scrollY);

      if (currentState !== HERO_ZOOM_STATE.Pinned) {
        frame.style.willChange = "transform";
        frame.setAttribute("inert", "");
        heroPin.style.visibility = "";
        transition(HERO_ZOOM_STATE.Pinned);
      }

      frame.style.transform = `translate3d(${style.translateX}px, ${style.translateY}px, 0) scale(${style.scale})`;
      frame.style.clipPath = `inset(0 0 ${style.clipBottomPx}px 0 round ${style.clipRadiusPx}px)`;
      stage.style.setProperty(HERO_FADE_VARIABLE, `${style.heroOpacity}`);
      stage.style.setProperty(
        BACKDROP_FADE_VARIABLE,
        `${style.backdropOpacity}`,
      );
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

    const measure = (): HeroZoomMeasurements | null => {
      const placeholder = stage.querySelector(
        `[${HERO_ZOOM_PLACEHOLDER_ATTRIBUTE}]`,
      );
      const replica = stage.querySelector(`[${HERO_ZOOM_REPLICA_ATTRIBUTE}]`);

      if (
        !(placeholder instanceof HTMLElement) ||
        !(replica instanceof HTMLElement)
      ) {
        return null;
      }

      const rect = placeholder.getBoundingClientRect();
      const frameWidth = frame.offsetWidth;

      if (frameWidth <= 0 || rect.width <= 0) {
        return null;
      }

      return {
        viewportHeight: window.innerHeight,
        frameTop: getLayoutDocumentTop(frame),
        frameLeft: getLayoutDocumentLeft(frame),
        frameWidth,
        frameHeight: frame.offsetHeight,
        replicaHeight: replica.offsetHeight,
        placeholderTop: rect.top,
        placeholderLeft: rect.left,
        placeholderWidth: rect.width,
        placeholderHeight: rect.height,
      };
    };

    const canActivate = () => {
      if (typeof window.matchMedia !== "function") {
        return false;
      }

      if (!window.matchMedia(DESKTOP_FINE_POINTER_MOTION_MEDIA_QUERY).matches) {
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
      measurements = measure();

      if (!measurements) {
        enterIdle();
        return;
      }

      render();

      const handleScroll = () => scheduleRender();
      const handleResize = () => {
        measurements = measure();
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

      const media = window.matchMedia(DESKTOP_FINE_POINTER_MOTION_MEDIA_QUERY);
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
      clearFrameStyles();
      clearFadeVariables();
      heroPin.style.visibility = "";
    };
  }, [frameRef, heroPinRef, stageRef]);
}
