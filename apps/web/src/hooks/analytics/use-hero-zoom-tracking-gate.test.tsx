// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LANDING_HERO_ZOOM_STATE_EVENT } from "@/common/constants/events";
import {
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
    window.dispatchEvent(
      new CustomEvent(LANDING_HERO_ZOOM_STATE_EVENT, { detail: { state } }),
    );
  });
}

describe("useHeroZoomTrackingGate", () => {
  afterEach(() => {
    cleanup();
  });

  it("gates until the zoom stage releases tracking", () => {
    render(<GateProbe />);

    expect(screen.getByTestId("gate").textContent).toBe("gated");
  });

  it("releases when the stage reports idle", () => {
    render(<GateProbe />);

    dispatchZoomState(HERO_ZOOM_STATE.Idle);

    expect(screen.getByTestId("gate").textContent).toBe("released");

    dispatchZoomState(HERO_ZOOM_STATE.Pinned);
  });

  it("gates while pinned and follows the zoom state events", () => {
    render(<GateProbe />);

    expect(screen.getByTestId("gate").textContent).toBe("gated");

    dispatchZoomState(HERO_ZOOM_STATE.Pinned);
    expect(screen.getByTestId("gate").textContent).toBe("gated");

    dispatchZoomState(HERO_ZOOM_STATE.Native);
    expect(screen.getByTestId("gate").textContent).toBe("released");

    dispatchZoomState(HERO_ZOOM_STATE.Pinned);
    expect(screen.getByTestId("gate").textContent).toBe("gated");
  });
});
