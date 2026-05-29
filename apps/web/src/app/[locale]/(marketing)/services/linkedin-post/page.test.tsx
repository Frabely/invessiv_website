// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LinkedInPostRoute, { generateMetadata } from "./page";

const { mockLinkedInPostPage, mockNotFound } = vi.hoisted(() => ({
  mockLinkedInPostPage: vi.fn(() => <div data-testid="linkedin-post-page" />),
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock(
  "@/components/marketing/linkedin-post/ai-workflows-page/ai-workflows-page",
  () => ({
    LinkedInPostPage: mockLinkedInPostPage,
  }),
);

describe("LinkedInPostRoute", () => {
  beforeEach(() => {
    mockLinkedInPostPage.mockClear();
    mockNotFound.mockClear();
  });

  it("renders the LinkedIn post page for supported locales", async () => {
    const { container } = render(
      await LinkedInPostRoute({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByTestId("linkedin-post-page")).toBeTruthy();
    expect(mockLinkedInPostPage).toHaveBeenCalledWith(
      { locale: "de" },
      undefined,
    );
    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).toBeTruthy();
  });

  it("returns notFound for unsupported locales", async () => {
    await expect(
      LinkedInPostRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("creates locale-specific metadata for de", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://invessiv.com/de/services/linkedin-post",
    );
    expect(metadata.title).toEqual({
      absolute: "LinkedIn-Post Generator | Invessiv",
    });
    expect(metadata.description).toContain("Generator");
    expect(metadata.openGraph?.locale).toBe("de_DE");
    expect(metadata.openGraph?.url).toBe(
      "https://invessiv.com/de/services/linkedin-post",
    );
  });

  it("creates locale-specific metadata for en", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://invessiv.com/en/services/linkedin-post",
    );
    expect(metadata.title).toEqual({
      absolute: "LinkedIn Post Generator | Invessiv",
    });
    expect(metadata.openGraph?.locale).toBe("en_US");
  });

  it("returns empty metadata for unsupported locales", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr" }),
    });
    expect(metadata).toEqual({});
  });
});
