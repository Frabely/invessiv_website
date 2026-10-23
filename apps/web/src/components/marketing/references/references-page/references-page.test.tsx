// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import { getReferencesPageContent } from "@/i18n/dictionaries/marketing/references";
import { ReferencesPage } from "./references-page";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      placeholder?: string;
      priority?: boolean;
    },
  ) => {
    const { fill, placeholder, priority, ...imgProps } = props;
    void fill;
    void placeholder;
    void priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock(
  "@/components/marketing/home/sections/footer-section/footer-section",
  () => ({
    FooterSection: () => <div data-testid="footer-section" />,
  }),
);

describe("ReferencesPage", () => {
  const content = getReferencesPageContent("de");

  afterEach(() => {
    cleanup();
  });

  it("shows the hero questions with their highlighted keyword", () => {
    render(<ReferencesPage content={content} locale="de" />);

    for (const question of content.hero.questions) {
      const keyword = screen.getByText(question.keyword, {
        selector: "strong",
      });

      expect(keyword.parentElement).toHaveTextContent(
        `${question.lead}${question.keyword}${question.trail}`,
      );
    }
  });

  it("renders one h1 and a project index that jumps to every case", () => {
    render(<ReferencesPage content={content} locale="de" />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: content.hero.title }),
    ).toBeInTheDocument();

    const index = screen.getByRole("list", { name: content.hero.indexLabel });
    const indexLinks = within(index).getAllByRole("link");

    expect(indexLinks.map((link) => link.getAttribute("href"))).toEqual(
      content.projects.map(
        (project) => `#${REFERENCE_SECTION_IDS[project.imageKey]}`,
      ),
    );
    expect(
      indexLinks.map((link) => [
        link.getAttribute("data-analytics-event"),
        link.getAttribute("data-analytics-payload"),
      ]),
    ).toEqual(
      content.projects.map((project) => [
        "reference_opened",
        JSON.stringify({ project: project.imageKey, target: "references" }),
      ]),
    );

    for (const project of content.projects) {
      expect(
        document.getElementById(REFERENCE_SECTION_IDS[project.imageKey]),
      ).toHaveAttribute(
        "aria-labelledby",
        `${REFERENCE_SECTION_IDS[project.imageKey]}-title`,
      );
    }
  });

  it("keeps breadcrumbs, the closing call to action and the footer", () => {
    render(<ReferencesPage content={content} locale="de" />);

    expect(
      screen.getByRole("navigation", { name: content.breadcrumbs.navLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.closingCta.primaryLabel }),
    ).toHaveAttribute("href", "/de#contact");
    expect(screen.getByTestId("footer-section")).toBeInTheDocument();
  });
});
