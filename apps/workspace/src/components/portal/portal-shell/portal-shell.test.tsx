// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { PortalShell } from "./portal-shell";

const mockUseLanguage = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">User menu</button>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/portal/customer-a",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => mockUseTheme(),
}));

const CONTENT = getPortalShellDictionary("de");

describe("PortalShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguage.mockReturnValue({ locale: "de", setLocale: vi.fn() });
    mockUseTheme.mockReturnValue({ theme: "dark", toggleTheme: vi.fn() });
  });

  afterEach(cleanup);

  it("renders the brand link, the switcher slot, the user menu and the page content", () => {
    render(
      <PortalShell
        content={CONTENT}
        homeHref="/de/portal/customer-a"
        brandName="Firma A"
        switcher={<span>Switcher slot</span>}
      >
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(screen.getByRole("link", { name: "Zum Überblick" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Switcher slot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User menu" })).toBeTruthy();
    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });

  it("shows the greeting in the header only when one is given", () => {
    const { rerender } = render(
      <PortalShell
        content={CONTENT}
        homeHref="/de/portal/customer-a"
        brandName="Firma A"
        greeting="Hallo Sam"
        switcher={<span />}
      >
        <p>Portal content</p>
      </PortalShell>,
    );
    expect(screen.getByText("Hallo Sam")).toBeInTheDocument();

    rerender(
      <PortalShell
        content={CONTENT}
        homeHref="/de/portal/customer-a"
        brandName="Firma A"
        switcher={<span />}
      >
        <p>Portal content</p>
      </PortalShell>,
    );
    expect(screen.queryByText("Hallo Sam")).toBeNull();
  });

  it("renders no nav element when there are no permitted nav items", () => {
    render(
      <PortalShell
        content={CONTENT}
        homeHref="/de/portal/customer-a"
        brandName="Firma A"
        switcher={<span />}
      >
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders the nav slot when provided", () => {
    render(
      <PortalShell
        content={CONTENT}
        homeHref="/de/portal/customer-a"
        brandName="Firma A"
        nav={<a href="#projects">Projects</a>}
        switcher={<span />}
      >
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Portal-Navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });
});
