// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";
import { LOCALE_SCROLL_RESTORE_STORAGE_KEY } from "@/lib/navigation/locale-scroll-restoration";

const mockUseLanguage = vi.fn();
const mockUseScrolledHeader = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock("next/image", () => ({
  default: () => <span data-testid="mock-next-image" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/imprint",
  useRouter: () => ({
    replace: mockRouterReplace,
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
    mockRouterReplace.mockReset();
    window.history.replaceState({}, "", "/de/imprint");
    window.sessionStorage.clear();
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
        navigation={[{ href: "#included" }, { href: "#services" }]}
      />,
    );

    expect(screen.getAllByText("Was du bekommst").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Angebote & Preise").length).toBeGreaterThan(0);
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
        navigation={[{ href: "#included" }, { href: "#services" }]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(mockRouterReplace).toHaveBeenCalledWith("/en/imprint", {
      scroll: false,
    });
  });

  it("does not carry a stale section hash into the locale switch", () => {
    const setLocale = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
      theme: "dark",
      toggleTheme: vi.fn(),
    });
    window.history.replaceState({}, "", "/de/imprint?ref=nav#services");

    render(
      <SiteHeader
        navigation={[{ href: "#included" }, { href: "#services" }]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

    expect(mockRouterReplace).toHaveBeenCalledWith("/en/imprint?ref=nav", {
      scroll: false,
    });
    expect(
      window.sessionStorage.getItem(LOCALE_SCROLL_RESTORE_STORAGE_KEY),
    ).toContain('"url":"/en/imprint?ref=nav"');
  });

  it("closes the mobile menu when a section link is clicked", () => {
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale: vi.fn(),
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    const { container } = render(
      <SiteHeader
        navigation={[{ href: "#included" }, { href: "#services" }]}
      />,
    );

    const mobileMenu = container.querySelector(".site-header__mobile-menu");
    if (!(mobileMenu instanceof HTMLDetailsElement)) {
      throw new Error("Expected mobile menu to be rendered");
    }

    mobileMenu.setAttribute("open", "");

    fireEvent.click(
      within(mobileMenu).getByRole("link", { name: "Was du bekommst" }),
    );

    expect(mobileMenu.hasAttribute("open")).toBe(false);
  });
});
