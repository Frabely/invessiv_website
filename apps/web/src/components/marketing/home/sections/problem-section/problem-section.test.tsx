// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { ProblemSection } from "./problem-section";

const content = getHomeUiContent("de").problemContent;

afterEach(() => {
  cleanup();
});

describe("ProblemSection", () => {
  it("renders every problem with its supporting note", () => {
    render(<ProblemSection content={content} id="problem" />);

    const list = screen.getByRole("list", { name: content.listAriaLabel });
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);

    for (const problem of content.problems) {
      expect(within(list).getByText(problem.label)).toBeTruthy();
      expect(within(list).getByText(problem.note)).toBeTruthy();
    }
  });

  it("labels the section by its heading and states the verdict", () => {
    render(<ProblemSection content={content} id="problem" />);

    const heading = screen.getByRole("heading", { name: content.title });
    expect(heading.id).toBe("problem-title");
    expect(
      document.getElementById("problem")?.getAttribute("aria-labelledby"),
    ).toBe("problem-title");

    expect(screen.getByText(content.conclusion)).toBeTruthy();
    expect(screen.getByText(content.resolution)).toBeTruthy();
  });

  it("links the CTA to the contact section", () => {
    render(<ProblemSection content={content} id="problem" />);

    const cta = screen.getByRole("link", { name: content.ctaLabel });
    expect(cta.getAttribute("href")).toBe("#contact");
    expect(cta.getAttribute("data-analytics-event")).toBe("cta_click");
    expect(cta.getAttribute("data-analytics-location")).toBe("problem");
  });

  it("keeps the ambient photo out of the accessibility tree", () => {
    render(<ProblemSection content={content} id="problem" />);

    expect(screen.getByAltText(content.photoAlt)).toBeTruthy();

    const images = Array.from(document.querySelectorAll("img"));
    expect(images).toHaveLength(2);
    expect(images.filter((image) => image.alt !== "")).toHaveLength(1);
  });
});
