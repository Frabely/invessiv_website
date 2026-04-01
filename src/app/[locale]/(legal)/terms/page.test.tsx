// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockNotFound, mockTermsContent, mockTermsLayout } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
  mockTermsLayout: vi.fn(
    ({
      children,
      lead,
      title,
      updatedAt,
    }: {
      children: ReactNode;
      lead: string;
      title: string;
      updatedAt: string;
    }) => (
      <div data-testid="terms-layout">
        <h1>{title}</h1>
        <p>{lead}</p>
        <p>{updatedAt}</p>
        {children}
      </div>
    ),
  ),
  mockTermsContent: vi.fn(
    ({
      sections,
      tocLabel,
    }: {
      sections: Array<{ id: string; title: string; body: ReactNode }>;
      tocLabel: string;
    }) => (
      <div data-testid="terms-content" data-toc-label={tocLabel}>
        {sections.map((section) => (
          <section key={section.id} data-section-id={section.id}>
            <h2>{section.title}</h2>
            <div>{section.body}</div>
          </section>
        ))}
      </div>
    ),
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/components/legal/terms-layout/terms-layout", () => ({
  TermsLayout: mockTermsLayout,
}));

vi.mock("@/components/legal/terms-content/terms-content", () => ({
  TermsContent: mockTermsContent,
}));

import TermsPage from "./page";

describe("TermsPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockTermsLayout.mockClear();
    mockTermsContent.mockClear();
  });

  it("renders the terms structure as primarily B2B with consumer contracts only by individual offer", async () => {
    render(await TermsPage({ params: Promise.resolve({ locale: "de" }) }));

    const renderedSectionIds = Array.from(
      document.querySelectorAll("[data-section-id]"),
    ).map((section) => section.getAttribute("data-section-id"));

    expect(renderedSectionIds).toEqual([
      "provider",
      "scope",
      "contract-conclusion",
      "services-scope",
      "client-cooperation",
      "payment",
      "consumer-contracts",
      "acceptance",
      "usage-rights",
      "third-party-services",
      "liability",
      "confidentiality",
      "final-provisions",
    ]);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Allgemeine Geschäftsbedingungen",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Zuletzt geändert: 26. März 2026.")).toBeTruthy();
    expect(
      screen.getByText(
        "Diese Bedingungen gelten im Regelfall für Verträge mit Unternehmern. Verträge mit Verbrauchern schließt Invessiv nur im Einzelfall auf Grundlage individueller Angebote.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Geschäftsbezeichnung:")).toBeTruthy();
    expect(screen.getByText("Invessiv")).toBeTruthy();
    expect(screen.getByText("Inhaber:")).toBeTruthy();
    expect(screen.getByText("Moritz Hecht")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "service@invessiv.com" })
        .getAttribute("href"),
    ).toBe("mailto:service@invessiv.com");
    expect(
      screen.getByText("7. Hinweise für Verbraucherverträge"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Die Webseite ermöglicht keinen unmittelbaren verbindlichen Vertragsabschluss\./,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/eingehende Anfragen, zugehörige Kommunikationsdaten und Bearbeitungsstände intern zu dokumentieren/),
    ).toBeTruthy();
    expect(
      screen.getByText(/ausnahmsweise Verträge mit Verbrauchern/),
    ).toBeTruthy();
    expect(screen.queryByText(/Bestellprozess/i)).toBeNull();
    expect(screen.queryByText(/Vercel Pro/i)).toBeNull();
    expect(screen.queryByText(/IONOS/i)).toBeNull();
  });

  it("calls notFound for unsupported locales", async () => {
    await expect(
      TermsPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
