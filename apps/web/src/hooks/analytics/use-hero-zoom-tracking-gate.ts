"use client";

import { useSyncExternalStore } from "react";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import {
  HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
  HERO_ZOOM_STATE,
} from "@/common/constants/marketing";

function isReleasedState(state: string | null) {
  return state === HERO_ZOOM_STATE.Idle || state === HERO_ZOOM_STATE.Native;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(LANDING_HERO_ZOOM_STATE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(LANDING_HERO_ZOOM_STATE_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  const stage = document.querySelector(`[${HERO_ZOOM_STAGE_STATE_ATTRIBUTE}]`);

  if (!stage) {
    return true;
  }

  return isReleasedState(stage.getAttribute(HERO_ZOOM_STAGE_STATE_ATTRIBUTE));
}

function getServerSnapshot() {
  return false;
}

export function useHeroZoomTrackingGate() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
