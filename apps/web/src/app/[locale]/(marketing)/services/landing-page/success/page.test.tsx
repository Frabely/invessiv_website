// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingSuccessRoute, { generateMetadata } from "./page";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: (props: { brandHref?: string; isMinimalHeader?: boolean }) => (
    <header
      data-testid="site-header"
      data-minimal={String(props.isMinimalHeader)}
    >
      <a href={props.brandHref}>brand</a>
    </header>
  ),
}));

describe("LandingSuccessRoute", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  it("renders the minimal header, success content, and footer for supported locales", async () => {
    const { container } = render(
      await LandingSuccessRoute({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Danke, deine Anfrage ist bei mir.",
      }),
    ).toBeTruthy();

    expect(container.querySelector('header a[href="/de"]')).toBeTruthy();
    expect(screen.getByTestId("site-header")).toHaveAttribute(
      "data-minimal",
      "true",
    );

    const back = screen.getByRole("link", { name: /Zurück zur Übersicht/ });
    expect(back.getAttribute("href")).toBe("/de/services/landing-page");

    const contact = screen.getByRole("link", {
      name: "Optional Termin buchen",
    });
    expect(contact.getAttribute("href")).toBe(
      "https://calendly.com/service-invessiv-cxf5/30min",
    );

    const footer = document.getElementById("footer");
    expect(footer).toBeTruthy();
    expect(footer?.querySelector('a[href="/de#services"]')).toBeTruthy();
    expect(footer?.querySelector('a[href="#services"]')).toBeNull();
  });

  it("returns notFound for unsupported locales", async () => {
    await expect(
      LandingSuccessRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("creates noindex success metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe(
      "https://invessiv.com/de/services/landing-page/success",
    );
    expect(metadata.title).toEqual({
      absolute: "Anfrage gesendet | Invessiv",
    });
  });
});
