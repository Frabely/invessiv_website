// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnchorOffsetScroll } from "./use-anchor-offset-scroll";

function AnchorScrollHarness() {
  useAnchorOffsetScroll();

  return (
    <>
      <header className="site-header" />
      <a className="skip-link" href="#main-content">
        Direkt zum Inhalt
      </a>
      <a href="#process">Zum Prozess</a>
      <main id="main-content">Main</main>
      <section id="process">Process</section>
    </>
  );
}

describe("useAnchorOffsetScroll", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty(
      "--anchor-scroll-offset",
      "120px",
    );
    window.history.replaceState({}, "", "/de");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
      }),
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("applies the anchor offset on hash link clicks", () => {
    render(<AnchorScrollHarness />);

    const header = document.querySelector(".site-header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("Expected site header to be rendered");
    }

    vi.spyOn(header, "getBoundingClientRect").mockReturnValue({
      top: 0,
      left: 0,
      right: 0,
      bottom: 64,
      width: 0,
      height: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const processSection = screen.getByText("Process");
    vi.spyOn(processSection, "getBoundingClientRect").mockReturnValue({
      top: 420,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 420,
      toJSON: () => ({}),
    });

    fireEvent.click(screen.getByRole("link", { name: "Zum Prozess" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 300,
      behavior: "smooth",
    });
    expect(window.location.hash).toBe("#process");
  });

  it("uses instant anchor scrolling when reduced motion is requested", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
      }),
    });

    render(<AnchorScrollHarness />);

    const processSection = screen.getByText("Process");
    vi.spyOn(processSection, "getBoundingClientRect").mockReturnValue({
      top: 420,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 420,
      toJSON: () => ({}),
    });

    fireEvent.click(screen.getByRole("link", { name: "Zum Prozess" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 300,
      behavior: "auto",
    });
  });

  it("leaves the skip link to native browser behavior", () => {
    render(<AnchorScrollHarness />);

    fireEvent.click(screen.getByRole("link", { name: "Direkt zum Inhalt" }));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
