// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import {
  HERO_ZOOM_STAGE_STATE_ATTRIBUTE,
  HERO_ZOOM_STATE,
  type HeroZoomState,
} from "@/common/constants/marketing";

import { useHeroZoomTrackingGate } from "./use-hero-zoom-tracking-gate";

function GateProbe() {
  const released = useHeroZoomTrackingGate();

  return <output data-testid="gate">{released ? "released" : "gated"}</output>;
}

function dispatchZoomState(state: HeroZoomState) {
  act(() => {
    const stage = document.querySelector(
      `[${HERO_ZOOM_STAGE_STATE_ATTRIBUTE}]`,
    );
    stage?.setAttribute(HERO_ZOOM_STAGE_STATE_ATTRIBUTE, state);
    window.dispatchEvent(
      new CustomEvent(LANDING_HERO_ZOOM_STATE_EVENT, { detail: { state } }),
    );
  });
}

describe("useHeroZoomTrackingGate", () => {
  afterEach(() => {
    cleanup();
  });

  it("releases immediately when no zoom stage exists", () => {
    render(<GateProbe />);

    expect(screen.getByTestId("gate").textContent).toBe("released");
  });

  it("releases immediately when the stage is already idle", () => {
    render(
      <>
        <div data-zoom-state={HERO_ZOOM_STATE.Idle} />
        <GateProbe />
      </>,
    );

    expect(screen.getByTestId("gate").textContent).toBe("released");
  });

  it("gates while pinned and follows the zoom state events", () => {
    render(
      <>
        <div data-zoom-state={HERO_ZOOM_STATE.Pending} />
        <GateProbe />
      </>,
    );

    expect(screen.getByTestId("gate").textContent).toBe("gated");

    dispatchZoomState(HERO_ZOOM_STATE.Pinned);
    expect(screen.getByTestId("gate").textContent).toBe("gated");

    dispatchZoomState(HERO_ZOOM_STATE.Native);
    expect(screen.getByTestId("gate").textContent).toBe("released");

    dispatchZoomState(HERO_ZOOM_STATE.Pinned);
    expect(screen.getByTestId("gate").textContent).toBe("gated");
  });
});
