// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { GeneratingPanel } from "./generating-panel";
import { GeneratorStepStatus } from "@/common/constants/generator/ui/generator-step-status";

const content = getLinkedInPostGeneratorContent("de");

afterEach(() => {
  cleanup();
});

describe("GeneratingPanel", () => {
  it("renders the loading headline and body as a polite status region", () => {
    render(<GeneratingPanel content={content} stepIndex={0} />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText(content.preview.loading.headline)).toBeTruthy();
    expect(screen.getByText(content.preview.loading.body)).toBeTruthy();
    expect(screen.getByText(content.form.loadingHelp)).toBeTruthy();
  });

  it("marks done / active / pending steps from the step index", () => {
    const { container } = render(
      <GeneratingPanel content={content} stepIndex={1} />,
    );

    const items = Array.from(container.querySelectorAll("li"));
    expect(items).toHaveLength(content.preview.loading.steps.length);
    expect(items[0]?.getAttribute("data-status")).toBe(
      GeneratorStepStatus.Done,
    );
    expect(items[1]?.getAttribute("data-status")).toBe(
      GeneratorStepStatus.Active,
    );
    expect(items[2]?.getAttribute("data-status")).toBe(
      GeneratorStepStatus.Pending,
    );
  });
});
