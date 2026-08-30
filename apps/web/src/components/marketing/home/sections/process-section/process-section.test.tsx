// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { ProcessSection } from "./process-section";

vi.mock("@/hooks/marketing/use-process-journey", () => ({
  useProcessJourney: () => undefined,
}));

describe("ProcessSection", () => {
  it("renders summary, steps with effort and result, and cta content", () => {
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

    const { container } = render(
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
    expect(
      container.querySelectorAll("[data-process-step='true']"),
    ).toHaveLength(processSection.processSteps.length);
    expect(screen.getByRole("heading", { name: firstStep.title })).toBeTruthy();
    const effortValue = firstStep.effort.split(":")[1]?.trim() ?? "";
    const resultValue = firstStep.result.split(":")[1]?.trim() ?? "";
    expect(screen.getByText(effortValue)).toBeTruthy();
    expect(screen.getByText(resultValue)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: processSection.processCta.label })
        .getAttribute("href"),
    ).toBe(processSection.processCta.href);
  });
});
