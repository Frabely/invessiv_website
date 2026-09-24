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
        locale="de"
        switcher={<span>Switcher slot</span>}
      >
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(
      screen.getByRole("link", { name: "Zur Firmenauswahl" }),
    ).toHaveAttribute("href", "/de/portal");
    expect(screen.getByText("Switcher slot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User menu" })).toBeTruthy();
    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });

  it("renders no nav element when there are no permitted nav items", () => {
    render(
      <PortalShell content={CONTENT} locale="de" switcher={<span />}>
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders the nav slot when provided", () => {
    render(
      <PortalShell
        content={CONTENT}
        locale="de"
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
