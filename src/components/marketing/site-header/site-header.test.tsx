// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

const mockUseLanguage = vi.fn();
const mockUseScrolledHeader = vi.fn();
const mockRouterPush = vi.fn();

vi.mock("next/image", () => ({
  default: () => <span data-testid="mock-next-image" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/imprint",
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock("@/hooks/marketing/use-scrolled-header", () => ({
  useScrolledHeader: (...args: unknown[]) => mockUseScrolledHeader(...args),
}));

describe("SiteHeader", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockUseScrolledHeader.mockReturnValue(false);
    mockRouterPush.mockReset();
  });

  it("renders localized navigation labels and cta for german locale", () => {
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale: vi.fn(),
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    render(
      <SiteHeader
        navigation={[
          { href: "#proof" },
          { href: "#services" },
        ]}
      />,
    );

    expect(screen.getAllByText("Ergebnisse").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leistungen & Preise").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Projekt anfragen").length).toBeGreaterThan(0);
  });

  it("triggers locale and theme actions", () => {
    const setLocale = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    render(
      <SiteHeader
        navigation={[
          { href: "#proof" },
          { href: "#services" },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(mockRouterPush).toHaveBeenCalledWith("/en/imprint");
  });
});
