// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage from "./page";

const { mockNotFound, mockLegalDocumentContent, mockLegalDocumentLayout } =
  vi.hoisted(() => ({
    mockNotFound: vi.fn(() => {
      throw new Error("notFound called");
    }),
    mockLegalDocumentLayout: vi.fn(
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
        <div data-testid="legal-document-layout">
          <h1>{title}</h1>
          <p>{lead}</p>
          <p>{updatedAt}</p>
          {children}
        </div>
      ),
    ),
    mockLegalDocumentContent: vi.fn(
      ({
        sections,
        tocLabel,
      }: {
        sections: Array<{ id: string; title: string; body: ReactNode }>;
        tocLabel: string;
      }) => (
        <div data-testid="legal-document-content" data-toc-label={tocLabel}>
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

vi.mock(
  "@/components/legal/legal-document-layout/legal-document-layout",
  () => ({
    LegalDocumentLayout: mockLegalDocumentLayout,
  }),
);

vi.mock(
  "@/components/legal/legal-document-content/legal-document-content",
  () => ({
    LegalDocumentContent: mockLegalDocumentContent,
  }),
);

describe("PrivacyPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockLegalDocumentLayout.mockClear();
    mockLegalDocumentContent.mockClear();
  });

  it("renders the updated privacy section structure and controller block", async () => {
    render(await PrivacyPage({ params: Promise.resolve({ locale: "de" }) }));

    const renderedSectionIds = Array.from(
      document.querySelectorAll("[data-section-id]"),
    ).map((section) => section.getAttribute("data-section-id"));

    expect(renderedSectionIds).toEqual([
      "controller",
      "hosting",
      "vercel-analytics",
      "speed-insights",
      "contact",
      "linkedin-post-generator",
      "appointments",
      "cookies",
      "recipients",
      "storage",
      "third-country-transfers",
      "rights",
      "complaints",
    ]);

    expect(
      screen.getByRole("heading", { level: 1, name: "Datenschutzerklärung" }),
    ).toBeTruthy();
    expect(screen.getByText("Zuletzt geändert: 29. April 2026.")).toBeTruthy();
    expect(screen.getByText("Invessiv")).toBeTruthy();
    expect(screen.getByText("Inhaber: Moritz Hecht")).toBeTruthy();
    expect(screen.queryByText("Moritz Hecht – Invessiv")).toBeNull();
    expect(screen.queryByText("5. Google Search Console")).toBeNull();
    expect(screen.queryByText("7. Kontaktaufnahme per E-Mail")).toBeNull();
    expect(screen.queryByText("8. Terminbuchung über Calendly")).toBeNull();
    expect(screen.queryByText("9. Online-Besprechungen über Zoom")).toBeNull();
    expect(
      screen.queryByText("16. Pflicht zur Bereitstellung von Daten"),
    ).toBeNull();
    expect(
      screen.queryByText("17. Keine automatisierte Entscheidungsfindung"),
    ).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "service@invessiv.com" })
        .getAttribute("href"),
    ).toBe("mailto:service@invessiv.com");
    expect(
      screen
        .getByRole("link", { name: "+49 1523 2070477" })
        .getAttribute("href"),
    ).toBe("tel:+4915232070477");
    expect(
      screen.getByText(/Lead-Datenbank auf Postgres-\/Neon-Basis/),
    ).toBeTruthy();
    expect(screen.getAllByText(/Formularstart/).length).toBeGreaterThan(1);
    expect(screen.getByText(/Sprach- und Theme-Wechsel/)).toBeTruthy();
    expect(
      screen.getByText(
        /grundsätzlich nach 24 Monaten gelöscht oder anonymisiert/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/invessiv-theme/)).toBeTruthy();
  });

  it("calls notFound for unsupported locales", async () => {
    await expect(
      PrivacyPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
