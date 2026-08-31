// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReferencesCaseStudyContent } from "@/i18n/dictionaries/marketing/references";
import { ReferenceProjectCard } from "./reference-project-card";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

const PROJECT: ReferencesCaseStudyContent = {
  category: "Positionierung & Anfrageführung",
  deliverables: ["Positionierung geschärft"],
  deliverablesLabel: "Leistungsbausteine",
  focus: "Vertrauen aufbauen und Anfragen führen.",
  focusLabel: "Projektfokus",
  href: "https://www.kolja-wienigk.de",
  imageAlt: "Vorschau der Finanzmakler-Webseite",
  imageKey: "kolja",
  kicker: "Webseiten-Projekt",
  linkLabel: "Zur Webseite",
  outcomes: ["führt Anfragen nachvollziehbar in den Kontakt"],
  outcomesLabel: "Was das Ergebnis leistet",
  summary: "Ein ruhiger, vertrauenswürdiger Auftritt.",
  testimonial: {
    authorName: "Kolja Wienigk",
    avatarAlt: "Porträt von Kolja Wienigk",
    avatarKey: "kolja",
    quote: "Die Umsetzung wirkte strukturiert und schnell.",
    role: "Finanzmakler aus Dresden",
  },
  title: "Finanzmakler-Webseite mit klarer Positionierung",
};

const TESTIMONIAL_LABELS = {
  collapseQuote: "Zitat einklappen",
  expandQuote: "Zitat ausklappen",
};

function renderCard(project: ReferencesCaseStudyContent) {
  render(
    <ReferenceProjectCard
      isPriorityMedia={false}
      project={project}
      testimonialLabels={TESTIMONIAL_LABELS}
    />,
  );
}

describe("ReferenceProjectCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the testimonial that belongs to the project", () => {
    renderCard(PROJECT);

    expect(screen.getByText("Kolja Wienigk")).toBeInTheDocument();
    expect(
      screen.getByText("Die Umsetzung wirkte strukturiert und schnell."),
    ).toBeInTheDocument();
  });

  it("parks the quote but keeps the person on the card", () => {
    renderCard({
      ...PROJECT,
      testimonial: { ...PROJECT.testimonial!, isQuoteHidden: true },
    });

    expect(
      screen.queryByText("Die Umsetzung wirkte strukturiert und schnell."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Kolja Wienigk")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Porträt von Kolja Wienigk" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finanzmakler aus Dresden")).toBeInTheDocument();
    expect(
      screen.getByText("Finanzmakler-Webseite mit klarer Positionierung"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Webseite" })).toHaveAttribute(
      "href",
      "https://www.kolja-wienigk.de",
    );
  });
});
