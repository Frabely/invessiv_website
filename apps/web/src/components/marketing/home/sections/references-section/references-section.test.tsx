// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { ReferencesSection } from "./references-section";

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

function renderSection() {
  const section = getHomeSections("de").find(
    (entry) => entry.id === "references",
  );

  if (!section) {
    throw new Error("Expected references section to be available.");
  }

  render(
    <ReferencesSection
      id="references"
      kicker={section.kicker}
      labels={section.labels}
      linkLabel={section.linkLabel}
      references={section.references}
      referencesHref="/de/references"
      title={section.title}
    />,
  );

  return section;
}

describe("ReferencesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows every reference at once without a selector", () => {
    const section = renderSection();

    expect(screen.queryByRole("button", { pressed: true })).toBeNull();

    const teasers = screen.getAllByRole("article");
    expect(teasers).toHaveLength(section.references.length);

    section.references.forEach((reference, index) => {
      const teaser = teasers[index];

      if (!teaser) {
        throw new Error("Expected a teaser per reference.");
      }

      expect(
        within(teaser).getAllByRole("heading", {
          name: reference.clientName,
        })[0],
      ).toBeInTheDocument();
      expect(within(teaser).getByText(reference.result)).toBeInTheDocument();
      expect(
        within(teaser).getByRole("link", { name: section.linkLabel }),
      ).toHaveAttribute("href", `/de/references#${reference.imageKey}`);
    });
  });

  it("alternates the collage side and highlights the quote", () => {
    const section = renderSection();
    const teasers = screen.getAllByRole("article");

    expect(teasers.map((teaser) => teaser.dataset.reversed)).toEqual(
      section.references.map((_, index) => String(index % 2 === 0)),
    );

    const [firstReference] = section.references;
    const highlight = firstReference?.testimonial?.highlight;

    if (!highlight) {
      throw new Error("Expected the first reference to have a highlight.");
    }

    expect(screen.getByText(highlight)).toBeInTheDocument();
  });
});
