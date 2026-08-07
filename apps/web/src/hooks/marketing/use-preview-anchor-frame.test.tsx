// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPreviewAnchor } from "@/common/constants/marketing";
import { usePreviewAnchorFrame } from "./use-preview-anchor-frame";

function rect({
  height,
  left = 0,
  top,
  width,
}: {
  height: number;
  left?: number;
  top: number;
  width: number;
}): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

function Fixture({
  activeAnchor,
}: {
  activeAnchor: LandingPreviewAnchor | null;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  usePreviewAnchorFrame(trackRef, overlayRef, activeAnchor);

  return (
    <div data-box="track" ref={trackRef}>
      <div data-preview-page="true">
        <span data-box="headline" data-preview-anchor="headline" />
        <span data-box="form" data-preview-anchor="form" />
      </div>
      <div
        data-active="false"
        data-animate="false"
        data-frame-ready="false"
        data-testid="overlay"
        ref={overlayRef}
      />
    </div>
  );
}

describe("usePreviewAnchorFrame", () => {
  let trackTop: number;

  beforeEach(() => {
    trackTop = 100;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      function clientHeight(this: HTMLElement) {
        return this.dataset.box === "track" ? 300 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.dataset.box === "track") {
          return rect({ height: 300, top: trackTop, width: 320 });
        }
        if (this.dataset.previewPage === "true") {
          return rect({ height: 760, top: trackTop, width: 320 });
        }
        if (this.dataset.box === "headline") {
          return rect({
            height: 40,
            left: 20,
            top: trackTop + 40,
            width: 200,
          });
        }
        if (this.dataset.box === "form") {
          return rect({
            height: 60,
            left: 30,
            top: trackTop + 700,
            width: 220,
          });
        }

        return rect({ height: 0, top: 0, width: 0 });
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("measures the first frame before activating the overlay", () => {
    const { getByTestId } = render(
      <Fixture activeAnchor={LandingPreviewAnchor.Form} />,
    );
    const overlay = getByTestId("overlay");
    const track = overlay.parentElement as HTMLElement;

    expect(track.style.getPropertyValue("--preview-pan")).toBe("-460px");
    expect(overlay.style.getPropertyValue("--preview-ring-top")).toBe("700px");
    expect(overlay.style.getPropertyValue("--preview-ring-left")).toBe("30px");
    expect(overlay.style.getPropertyValue("--preview-ring-width")).toBe(
      "220px",
    );
    expect(overlay.style.getPropertyValue("--preview-ring-height")).toBe(
      "60px",
    );
    expect(overlay.dataset.animate).toBe("false");
    expect(overlay.dataset.active).toBe("true");
  });

  it("animates subsequent frames and resets pan without discarding geometry", () => {
    const view = render(<Fixture activeAnchor={LandingPreviewAnchor.Form} />);
    const overlay = view.getByTestId("overlay");
    const track = overlay.parentElement as HTMLElement;

    view.rerender(<Fixture activeAnchor={LandingPreviewAnchor.Headline} />);

    expect(track.style.getPropertyValue("--preview-pan")).toBe("0px");
    expect(overlay.style.getPropertyValue("--preview-ring-top")).toBe("40px");
    expect(overlay.dataset.animate).toBe("true");

    view.rerender(<Fixture activeAnchor={null} />);

    expect(track.style.getPropertyValue("--preview-pan")).toBe("0px");
    expect(overlay.dataset.active).toBe("false");
    expect(overlay.style.getPropertyValue("--preview-ring-top")).toBe("40px");
  });

  it("moves the first anchor down when the track begins above the viewport", () => {
    trackTop = -200;

    const { getByTestId } = render(
      <Fixture activeAnchor={LandingPreviewAnchor.Headline} />,
    );
    const overlay = getByTestId("overlay");
    const track = overlay.parentElement as HTMLElement;

    expect(track.style.getPropertyValue("--preview-pan")).toBe("190px");
    expect(overlay.dataset.active).toBe("true");
  });
});
