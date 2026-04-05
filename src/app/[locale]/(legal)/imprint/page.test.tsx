// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import ImprintPage from "./page";

describe("ImprintPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockLegalDocumentLayout.mockClear();
    mockLegalDocumentContent.mockClear();
  });

  it("renders the updated imprint content and social links", async () => {
    render(await ImprintPage({ params: Promise.resolve({ locale: "de" }) }));

    const renderedSectionIds = Array.from(
      document.querySelectorAll("[data-section-id]"),
    ).map((section) => section.getAttribute("data-section-id"));

    expect(renderedSectionIds).toEqual(["provider", "social"]);
    expect(
      screen.getByRole("heading", { level: 1, name: "Impressum" }),
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
      screen
        .getByRole("link", { name: "+49 1523 2070477" })
        .getAttribute("href"),
    ).toBe("tel:+4915232070477");
    expect(
      screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href"),
    ).toBe("https://www.linkedin.com/company/invessiv");
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/invessiv",
    );
    expect(
      screen.getByRole("link", { name: "Instagram" }).getAttribute("href"),
    ).toBe("https://www.instagram.com/invessiv/");
  });

  it("calls notFound for unsupported locales", async () => {
    await expect(
      ImprintPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
