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
const mockUseTheme = vi.fn();
const mockUseScrolledHeader = vi.fn();
const mockRouterReplace = vi.fn();
const mockTrackConversionEvent = vi.fn();

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

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("@/hooks/marketing/use-scrolled-header", () => ({
  useScrolledHeader: (...args: unknown[]) => mockUseScrolledHeader(...args),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: (...args: unknown[]) =>
    mockTrackConversionEvent(...args),
}));

vi.mock(
  "@/components/marketing/shared/reading-progress/reading-progress",
  () => ({
    ReadingProgress: () => <div data-testid="reading-progress" />,
  }),
);

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
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    render(
      <SiteHeader
        navigation={[{ href: "#lead-bridge" }, { href: "#services" }]}
      />,
    );

    expect(screen.getAllByText("Einstieg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leistungsmodelle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Projekt anfragen").length).toBeGreaterThan(0);
    expect(screen.getByTestId("reading-progress")).toBeTruthy();
  });

  it("triggers locale and theme actions", () => {
    const setLocale = vi.fn();
    const toggleTheme = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme,
    });

    render(
      <SiteHeader
        navigation={[{ href: "#lead-bridge" }, { href: "#services" }]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Zu Light wechseln" })[0],
    );

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(toggleTheme).toHaveBeenCalledTimes(1);
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("language_switch", {
      location: "header",
      target: "en",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("theme_switch", {
      location: "header",
      target: "light",
    });
    expect(mockRouterReplace).toHaveBeenCalledWith("/en/imprint", {
      scroll: false,
    });
  });

  it("can hide the theme switch for focused landing pages", () => {
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale: vi.fn(),
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    render(<SiteHeader navigation={[]} showThemeSwitch={false} />);

    expect(
      screen.queryByRole("button", { name: "Zu Light wechseln" }),
    ).toBeNull();
  });

  it("does not carry a stale section hash into the locale switch", () => {
    const setLocale = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme: vi.fn(),
    });
    window.history.replaceState({}, "", "/de/imprint?ref=nav#services");

    render(
      <SiteHeader
        navigation={[{ href: "#lead-bridge" }, { href: "#services" }]}
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

  it("does not track or navigate when selecting the active locale", () => {
    const setLocale = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    const { container } = render(
      <SiteHeader
        navigation={[{ href: "#lead-bridge" }, { href: "#services" }]}
      />,
    );

    const desktopLocaleMenu = container.querySelector("details");
    if (!(desktopLocaleMenu instanceof HTMLDetailsElement)) {
      throw new Error("Expected locale menu to be rendered");
    }

    desktopLocaleMenu.setAttribute("open", "");
    fireEvent.click(screen.getAllByRole("button", { name: "DE" })[0]);

    expect(setLocale).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(mockTrackConversionEvent).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(LOCALE_SCROLL_RESTORE_STORAGE_KEY),
    ).toBeNull();
    expect(desktopLocaleMenu.hasAttribute("open")).toBe(false);
  });

  it("closes the mobile menu when a section link is clicked", () => {
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale: vi.fn(),
    });
    mockUseTheme.mockReturnValue({
      isMounted: true,
      theme: "dark",
      toggleTheme: vi.fn(),
    });

    const { container } = render(
      <SiteHeader
        navigation={[{ href: "#lead-bridge" }, { href: "#services" }]}
      />,
    );

    const mobileMenu = container.querySelector(".site-header__mobile-menu");
    if (!(mobileMenu instanceof HTMLDetailsElement)) {
      throw new Error("Expected mobile menu to be rendered");
    }

    mobileMenu.setAttribute("open", "");

    fireEvent.click(within(mobileMenu).getByRole("link", { name: "Einstieg" }));

    expect(mobileMenu.hasAttribute("open")).toBe(false);
  });
});
