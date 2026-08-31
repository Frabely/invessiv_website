// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuccessRoute, { generateMetadata } from "./page";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  usePathname: () => "/de/success",
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

describe("SuccessRoute", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  it("renders the generic email-success content for supported locales", async () => {
    const { container } = render(
      await SuccessRoute({ params: Promise.resolve({ locale: "de" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Danke, deine Nachricht ist angekommen.",
      }),
    ).toBeTruthy();
    expect(container.querySelector('header a[href="/de"]')).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Zur Startseite" }).getAttribute("href"),
    ).toBe("/de");
    expect(
      screen.getByRole("link", { name: "Termin buchen" }).getAttribute("href"),
    ).toBe("https://calendly.com/service-invessiv-cxf5/30min");
  });

  it("returns notFound for unsupported locales", async () => {
    await expect(
      SuccessRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("creates noindex metadata for the generic success route", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe(
      "https://www.invessiv.com/de/success",
    );
    expect(metadata.title).toEqual({ absolute: "Anfrage gesendet | Invessiv" });
  });
});
