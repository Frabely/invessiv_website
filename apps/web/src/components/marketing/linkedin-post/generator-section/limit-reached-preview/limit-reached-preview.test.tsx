// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LimitReachedPreview } from "./limit-reached-preview";

const content = getLinkedInPostGeneratorContent("de").preview.limitReached;

afterEach(cleanup);

describe("LimitReachedPreview", () => {
  it("renders a positive, non-error framing with a reset date", () => {
    const { container } = render(
      <LimitReachedPreview
        content={content}
        followUpHref="#contact"
        locale="de"
        onRequestCustomWorkflow={vi.fn()}
        usageLimit={{
          limit: 2,
          remaining: 0,
          resetAt: "2026-07-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(content.headline)).toBeTruthy();
    expect(screen.getByText(/Neue Tests ab/)).toBeTruthy();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("dispatches the custom-workflow prefill when the CTA is clicked", () => {
    const onRequestCustomWorkflow = vi.fn();
    render(
      <LimitReachedPreview
        content={content}
        followUpHref="#contact"
        locale="de"
        onRequestCustomWorkflow={onRequestCustomWorkflow}
        usageLimit={{
          limit: 2,
          remaining: 0,
          resetAt: "2026-07-01T00:00:00.000Z",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: content.ctaAriaLabel }));
    expect(onRequestCustomWorkflow).toHaveBeenCalledTimes(1);
  });
});
