// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProofPreviewExperience } from "./proof-preview-experience";

const matchMediaMock = vi.fn();

describe("ProofPreviewExperience", () => {
  beforeEach(() => {
    matchMediaMock.mockReset();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("uses the desktop web view as default on larger viewports", () => {
    matchMediaMock.mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      matches: false,
      media: "(max-width: 759px)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    });

    render(
      <ProofPreviewExperience
        desktopModeKey="desktop"
        embedUrl="https://consumption-trial.invessiv.com"
        hint="Desktop starts in the regular web view."
        iframeTitle="Tool preview"
        mobileModeKey="app"
        openLabel="Open tool directly"
        options={[
          {
            badge: "Recommended",
            description: "Compact app frame.",
            frameLabel: "App frame",
            key: "app",
            label: "As app preview",
            viewport: "app",
          },
          {
            description: "Regular browser frame.",
            frameLabel: "Desktop web view",
            key: "desktop",
            label: "As website",
            viewport: "desktop",
          },
        ]}
        projectHref="https://consumption-trial.invessiv.com"
        projectKicker="Project example"
        projectLinkLabel="View example"
        projectTitle="Process optimisation dashboard"
        prompt="Choose the right view."
      />,
    );

    expect(
      screen
        .getByRole("radio", { name: /As website/i })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByTitle("Tool preview").className).toContain(
      "iframeDesktop",
    );
  });

  it("switches to the app frame when that option is selected", () => {
    matchMediaMock.mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      matches: false,
      media: "(max-width: 759px)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    });

    render(
      <ProofPreviewExperience
        desktopModeKey="desktop"
        embedUrl="https://consumption-trial.invessiv.com"
        hint="Desktop starts in the regular web view."
        iframeTitle="Tool preview"
        mobileModeKey="app"
        openLabel="Open tool directly"
        options={[
          {
            badge: "Recommended",
            description: "Compact app frame.",
            frameLabel: "App frame",
            key: "app",
            label: "As app preview",
            viewport: "app",
          },
          {
            description: "Regular browser frame.",
            frameLabel: "Desktop web view",
            key: "desktop",
            label: "As website",
            viewport: "desktop",
          },
        ]}
        projectHref="https://consumption-trial.invessiv.com"
        projectKicker="Project example"
        projectLinkLabel="View example"
        projectTitle="Process optimisation dashboard"
        prompt="Choose the right view."
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /As app preview/i }));

    expect(
      screen
        .getByRole("radio", { name: /As app preview/i })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByTitle("Tool preview").className).toContain("iframeApp");
    expect(screen.getByText("App frame")).toBeTruthy();
  });

  it("starts in the app frame on small viewports", () => {
    matchMediaMock.mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      matches: true,
      media: "(max-width: 759px)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    });

    render(
      <ProofPreviewExperience
        desktopModeKey="desktop"
        embedUrl="https://consumption-trial.invessiv.com"
        hint="Mobile starts in the app view."
        iframeTitle="Tool preview"
        mobileModeKey="app"
        openLabel="Open tool directly"
        options={[
          {
            badge: "Recommended",
            description: "Compact app frame.",
            frameLabel: "App frame",
            key: "app",
            label: "As app preview",
            viewport: "app",
          },
          {
            description: "Regular browser frame.",
            frameLabel: "Desktop web view",
            key: "desktop",
            label: "As website",
            viewport: "desktop",
          },
        ]}
        projectHref="https://consumption-trial.invessiv.com"
        projectKicker="Project example"
        projectLinkLabel="View example"
        projectTitle="Process optimisation dashboard"
        prompt="Choose the right view."
      />,
    );

    expect(
      screen
        .getByRole("radio", { name: /As app preview/i })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByTitle("Tool preview").className).toContain("iframeApp");
  });
});
