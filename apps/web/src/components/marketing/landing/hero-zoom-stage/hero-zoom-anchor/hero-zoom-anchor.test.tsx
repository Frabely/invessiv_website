// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HeroZoomAnchor } from "./hero-zoom-anchor";

describe("HeroZoomAnchor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders only the zoom measurement marker", () => {
    const { container } = render(<HeroZoomAnchor />);
    const anchor = container.querySelector("[data-hero-zoom-placeholder]");

    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute("aria-hidden")).toBe("true");
    expect(anchor?.textContent).toBe("");
    expect(anchor?.querySelector("*")).toBeNull();
  });
});
