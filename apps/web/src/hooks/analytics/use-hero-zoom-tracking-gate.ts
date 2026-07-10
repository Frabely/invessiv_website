"use client";

import { useSyncExternalStore } from "react";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import { HERO_ZOOM_STATE } from "@/common/constants/marketing";

function isReleasedState(state: string | null) {
  return state === HERO_ZOOM_STATE.Idle || state === HERO_ZOOM_STATE.Native;
}

let isHeroZoomTrackingReleased = false;

function subscribe(onStoreChange: () => void) {
  const handleZoomStateChange = (event: Event) => {
    const detail =
      event instanceof CustomEvent ? (event.detail as { state?: string }) : {};

    isHeroZoomTrackingReleased = isReleasedState(detail.state ?? null);
    onStoreChange();
  };

  window.addEventListener(LANDING_HERO_ZOOM_STATE_EVENT, handleZoomStateChange);

  return () => {
    window.removeEventListener(
      LANDING_HERO_ZOOM_STATE_EVENT,
      handleZoomStateChange,
    );
  };
}

function getSnapshot() {
  return isHeroZoomTrackingReleased;
}

function getServerSnapshot() {
  return false;
}

export function useHeroZoomTrackingGate() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
