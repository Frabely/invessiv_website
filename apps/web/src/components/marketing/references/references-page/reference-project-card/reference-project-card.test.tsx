// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import type { ReferenceCaseStudyLabels } from "@/common/contracts/marketing/reference-case-study-labels";
import { ReferenceProjectCard } from "./reference-project-card";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      placeholder?: string;
      priority?: boolean;
    },
  ) => {
    const { placeholder, priority, ...imgProps } = props;
    void placeholder;
    void priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

const LABELS: ReferenceCaseStudyLabels = {
  collapseQuote: "Zitat einklappen",
  expandQuote: "Ganzes Zitat lesen",
  gallery: "Einblicke in die Seite",
  problem: "Problem",
  result: "Ergebnis",
  scope: "Was ich konkret umgesetzt habe",
  solution: "Lösung",
};

const PROJECT: ReferenceCaseStudyContent = {
  clientName: "Kolja Wienigk",
  href: "https://www.kolja-wienigk.de",
  imageKey: "kolja",
  industry: "Finanzmakler aus Dresden",
  linkLabel: "Kolja Wienigk live ansehen",
  problem: "Finanzthemen wirken kompliziert.",
  result: "Die Seite wirkt seriös.",
  scope: ["Positionierung geschärft"],
  shots: [
    {
      alt: "Startbereich",
      caption: "Der Einstieg.",
      label: "Start",
      shotKey: "kolja-overview",
    },
    {
      alt: "Leistungen",
      caption: "Die Leistungen.",
      label: "Leistungen",
      shotKey: "kolja-services",
    },
  ],
  solution: "Ein ruhiger Auftritt.",
  testimonial: {
    authorName: "Kolja Wienigk",
    avatarAlt: "Porträt von Kolja Wienigk",
    avatarKey: "kolja",
    highlight: "Ich bin sehr zufrieden.",
    quote: "Die Zusammenarbeit war klar. Ich bin sehr zufrieden.",
    role: "Finanzmakler aus Dresden",
  },
  title: "Finanzmakler-Webseite mit klarer Positionierung",
};

describe("ReferenceProjectCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("tells the case as problem, solution and result", () => {
    render(
      <ReferenceProjectCard
        isReversed={false}
        labels={LABELS}
        project={PROJECT}
      />,
    );

    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    expect(terms).toEqual(["Problem", "Lösung", "Ergebnis"]);
    expect(
      screen.getByText("Finanzthemen wirken kompliziert."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ein ruhiger Auftritt.")).toBeInTheDocument();
    expect(screen.getByText("Die Seite wirkt seriös.")).toBeInTheDocument();
  });

  it("links the live site and keeps the scope behind a disclosure", () => {
    render(
      <ReferenceProjectCard
        isReversed={false}
        labels={LABELS}
        project={PROJECT}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Kolja Wienigk live ansehen" }),
    ).toHaveAttribute("href", "https://www.kolja-wienigk.de");
    expect(
      screen.getByText("Positionierung geschärft").closest("details"),
    ).not.toHaveAttribute("open");
  });

  it("shows the highlighted sentence and keeps the full quote available", () => {
    render(
      <ReferenceProjectCard
        isReversed={false}
        labels={LABELS}
        project={PROJECT}
      />,
    );

    expect(screen.getByText("Ich bin sehr zufrieden.")).toBeInTheDocument();
    expect(
      screen.getByText("Die Zusammenarbeit war klar. Ich bin sehr zufrieden."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ganzes Zitat lesen")).toBeInTheDocument();
  });
});
