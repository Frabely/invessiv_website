// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomCursor, resolveCustomCursorState } from "./custom-cursor";

const mockUseLanguage = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => mockUseTheme(),
}));

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: "(hover: hover) and (pointer: fine)",
      onchange: null,
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

describe("custom cursor", () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({
      locale: "de",
    });
    mockUseTheme.mockReturnValue({
      theme: "dark",
    });
    installMatchMedia(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute("data-custom-cursor");
  });

  it("maps hover targets to cursor tones", () => {
    render(<CustomCursor />);

    const primaryLink = document.createElement("a");
    primaryLink.href = "/de#contact";
    primaryLink.dataset.analyticsVariant = "primary";
    document.body.appendChild(primaryLink);

    const copyButton = document.createElement("button");
    copyButton.dataset.cursorKind = "copy";
    document.body.appendChild(copyButton);

    const textField = document.createElement("textarea");
    document.body.appendChild(textField);

    expect(resolveCustomCursorState(primaryLink)).toMatchObject({
      active: true,
      tone: "cta",
    });
    expect(resolveCustomCursorState(copyButton)).toMatchObject({
      active: true,
      tone: "copy",
    });
    expect(resolveCustomCursorState(textField)).toMatchObject({
      active: true,
      tone: "type",
    });
  });

  it("does not render on coarse pointers", () => {
    installMatchMedia(false);

    const { container } = render(<CustomCursor />);

    expect(container.firstChild).toBeNull();
    expect(
      document.documentElement.getAttribute("data-custom-cursor"),
    ).toBeNull();
  });
});
