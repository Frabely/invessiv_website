// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceEntry } from "@/common/contracts/marketing/reference-entry";
import { ReferencesSection } from "./references-section";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
    },
  ) => {
    const { fill, priority, ...imgProps } = props;
    void fill;
    void priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

const LABELS = {
  collapseQuote: "Zitat einklappen",
  counterTemplate: "Referenz {current} von {total}",
  expandQuote: "Ganzes Zitat lesen",
  showcaseAriaLabel: "Referenzen von Kunden mit Projektvorschau",
};

const ENTRIES = [
  {
    authorName: "Dr. Christoph Allmacher",
    avatarAlt: "Porträt von Dr. Christoph Allmacher",
    avatarKey: "allmacher",
    imageAlt: "Startseite von Allmacher Coaching",
    imageKey: "allmacher",
    linkLabel: "Projekt im Detail ansehen",
    quote: "Die Zusammenarbeit ist angenehm entspannt und sehr professionell.",
    role: "Allmacher Coaching",
    selectorLabel: "Allmacher Coaching",
    siteLabel: "allmacher-coaching.de",
  },
  {
    authorName: "Kolja Wienigk",
    avatarAlt: "Porträt von Kolja Wienigk",
    avatarKey: "kolja",
    imageAlt: "Startseite der Finanzberatung von Kolja Wienigk",
    imageKey: "kolja",
    linkLabel: "Projekt im Detail ansehen",
    quote: "Die Umsetzung wirkte strukturiert und schnell.",
    role: "Finanzmakler aus Dresden",
    selectorLabel: "Kolja Wienigk · Finanzmakler",
    siteLabel: "kolja-wienigk.de",
  },
] as const;

function renderSection(entries: ReferenceEntry[] = [...ENTRIES]) {
  render(
    <ReferencesSection
      entries={entries}
      id="references"
      kicker="Projekte & Kundenstimmen"
      labels={LABELS}
      referencesHref="/de/references"
      title="Was entsteht, wenn wir zusammenarbeiten?"
    />,
  );
}

describe("ReferencesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the first reference with its project link", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: "Dr. Christoph Allmacher" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Referenz 1 von 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projekt im Detail ansehen" }),
    ).toHaveAttribute("href", "/de/references#allmacher");
    expect(
      screen.getByRole("link", {
        name: "Projekt im Detail ansehen: Allmacher Coaching",
      }),
    ).toHaveAttribute("href", "/de/references#allmacher");
    expect(
      screen.getByRole("img", {
        name: "Porträt von Dr. Christoph Allmacher",
      }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: "Allmacher Coaching" })
        .compareDocumentPosition(
          screen.getByRole("img", {
            name: "Startseite von Allmacher Coaching",
          }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Alle Referenzen ansehen" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Ausgewählte Kundenprojekte und ehrliche Stimmen aus der Zusammenarbeit.",
      ),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('img[data-avatar="allmacher"][alt=""]'),
    ).toBeInTheDocument();
  });

  it("parks the quote but keeps the person visible in the showcase", () => {
    renderSection(
      ENTRIES.map((entry) =>
        entry.imageKey === "kolja"
          ? { ...entry, isQuoteHidden: true }
          : { ...entry },
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Kolja Wienigk · Finanzmakler" }),
    );

    expect(
      screen.queryByText("Die Umsetzung wirkte strukturiert und schnell."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Kolja Wienigk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Porträt von Kolja Wienigk" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finanzmakler aus Dresden")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projekt im Detail ansehen" }),
    ).toHaveAttribute("href", "/de/references#kolja");
  });

  it("selects references directly by the person's name", () => {
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Kolja Wienigk · Finanzmakler" }),
    );

    expect(
      screen.getByRole("heading", { name: "Kolja Wienigk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projekt im Detail ansehen" }),
    ).toHaveAttribute("href", "/de/references#kolja");
    expect(
      screen.getByRole("link", {
        name: "Projekt im Detail ansehen: Kolja Wienigk · Finanzmakler",
      }),
    ).toHaveAttribute("href", "/de/references#kolja");

    expect(
      document.querySelector('img[data-avatar="kolja"][alt=""]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Allmacher Coaching" }));

    expect(
      screen.getByRole("heading", { name: "Dr. Christoph Allmacher" }),
    ).toBeInTheDocument();
  });
});
