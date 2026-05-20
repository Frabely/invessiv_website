// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { ProcessSection } from "./process-section";

vi.mock("@/hooks/marketing/use-process-start-point", () => ({
  useProcessStartPoint: () => undefined,
}));

describe("ProcessSection", () => {
  it("renders summary, roles, steps and cta content", () => {
    const processSection = getHomeSections("de").find(
      (section) => section.id === "process",
    );
    if (!processSection) {
      throw new Error(
        "Expected process section to be available in home dictionary.",
      );
    }
    const firstStep = processSection.processSteps[0];
    if (!firstStep || !processSection.processCta || !processSection.title) {
      throw new Error(
        "Expected process section to include title, CTA and steps.",
      );
    }

    render(
      <ProcessSection
        description={processSection.description}
        id="process"
        processCta={processSection.processCta}
        processSteps={processSection.processSteps}
        summaryPoints={processSection.summaryPoints}
        title={processSection.title}
      />,
    );

    expect(
      screen.getByRole("heading", { name: processSection.title }),
    ).toBeTruthy();
    expect(screen.getByText(processSection.summaryPoints[0])).toBeTruthy();
    expect(screen.getByText(firstStep.deliverable)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: processSection.processCta.label })
        .getAttribute("href"),
    ).toBe(processSection.processCta.href);
  });
});
