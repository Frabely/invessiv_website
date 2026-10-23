// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReferencesLocalePage, { generateMetadata } from "./page";

const { mockNotFound, mockReferencesPage } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
  mockReferencesPage: vi.fn(() => <div data-testid="references-page" />),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock(
  "@/components/marketing/references/references-page/references-page",
  () => ({
    ReferencesPage: mockReferencesPage,
  }),
);

function renderedContent() {
  const [props] = mockReferencesPage.mock.calls[0] as unknown as [
    {
      content: {
        projects: { imageKey: string }[];
      };
    },
  ];

  return props.content;
}

describe("ReferencesLocalePage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockReferencesPage.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the page without the consumption reference while its flag is disabled", async () => {
    render(
      await ReferencesLocalePage({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    const content = renderedContent();

    expect(content.projects.map((project) => project.imageKey)).toEqual([
      "allmacher",
      "kolja",
    ]);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("renders the consumption reference when its flag is enabled", async () => {
    vi.stubEnv("ENABLE_MARKETING_REFERENCE_CONSUMPTION", "true");

    render(
      await ReferencesLocalePage({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(
      renderedContent().projects.map((project) => project.imageKey),
    ).toContain("consumption");
  });

  it("creates locale-specific references metadata with an indexable canonical", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });

    expect(metadata.title).toBe("Webdesign-Referenzen von Moritz Hecht");
    expect(metadata.description).toBe(
      "Webdesign-Referenzen von Moritz Hecht aus Chemnitz: was vorher gefehlt hat, was daraus entstanden ist und was Kunden sagen. Alle Seiten live ansehen.",
    );
    expect(metadata.openGraph?.title).toBe("Webdesign-Referenzen | Invessiv");
    expect(metadata.alternates?.canonical).toBe(
      "https://www.invessiv.com/de/references",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Die Webseite von Allmacher Coaching als erste Webdesign-Referenz von Invessiv.",
        height: 630,
        url: "https://www.invessiv.com/og/references-de.png",
        width: 1200,
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      {
        alt: "Die Webseite von Allmacher Coaching als erste Webdesign-Referenz von Invessiv.",
        url: "https://www.invessiv.com/og/references-de.png",
      },
    ]);
    expect(metadata.robots).toBeUndefined();
  });

  it("uses the English references OG image", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.invessiv.com/en/references",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "The Allmacher Coaching website as Invessiv's first web design reference.",
        height: 630,
        url: "https://www.invessiv.com/og/references-en.png",
        width: 1200,
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      {
        alt: "The Allmacher Coaching website as Invessiv's first web design reference.",
        url: "https://www.invessiv.com/og/references-en.png",
      },
    ]);
  });
});
