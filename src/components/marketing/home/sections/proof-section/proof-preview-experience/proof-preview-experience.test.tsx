// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProofPreviewExperience } from "./proof-preview-experience";

describe("ProofPreviewExperience", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the website preview in a desktop frame when configured as desktop", () => {
    render(
      <ProofPreviewExperience
        embedUrl="https://consumption-trial.invessiv.com"
        frameLabel="Desktop web view"
        hint="This card always shows the preview directly as a website."
        iframeTitle="Tool preview"
        openLabel="Open tool directly"
        projectHref="https://consumption-trial.invessiv.com"
        projectKicker="Project example"
        projectLinkLabel="View example"
        projectTitle="Process optimisation dashboard"
        viewport="desktop"
      />,
    );

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("Desktop web view")).toBeTruthy();
    expect(screen.getByTitle("Tool preview").className).toContain(
      "iframeDesktop",
    );
  });

  it("renders the app preview in an app frame when configured as app", () => {
    render(
      <ProofPreviewExperience
        embedUrl="https://consumption-trial.invessiv.com"
        frameLabel="App frame"
        hint="This card always shows the preview directly as an app."
        iframeTitle="Tool preview"
        openLabel="Open tool directly"
        projectHref="https://consumption-trial.invessiv.com"
        projectKicker="Project example"
        projectLinkLabel="View example"
        projectTitle="Process optimisation dashboard"
        viewport="app"
      />,
    );

    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      screen.queryByText(
        "This card always shows the preview directly as an app.",
      ),
    ).toBeNull();
    expect(screen.queryByText("App frame")).toBeNull();
    expect(screen.queryByText("Open tool directly")).toBeNull();
    expect(screen.getByText("Project example")).toBeTruthy();
    expect(screen.getByText("Process optimisation dashboard")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "View example" }).getAttribute("href"),
    ).toBe("https://consumption-trial.invessiv.com");
    expect(screen.getByTitle("Tool preview").className).toContain("iframeApp");
  });
});
