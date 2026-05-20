// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { WorkspaceHeader } from "./workspace-header";

const mockUseLanguage = vi.fn();
const mockUseTheme = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock("next/image", () => ({
  default: () => <span data-testid="mock-next-image" />,
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">User menu</button>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de",
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

describe("WorkspaceHeader", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/de?panel=leads");
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale: vi.fn(),
    });
    mockUseTheme.mockReturnValue({
      theme: "dark",
      toggleTheme: vi.fn(),
    });
  });

  it("renders workspace brand, search, actions and Clerk user button", () => {
    render(
      <WorkspaceHeader
        content={getWorkspacePageContent("de")}
        isMobileMenuOpen={false}
        locale="de"
        onMobileMenuToggleAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "Zum Workspace" })).toHaveAttribute(
      "href",
      "/de",
    );
    expect(
      screen.getByRole("searchbox", { name: "Leads suchen" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Hellen Modus aktivieren" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "User menu" })).toBeTruthy();
  });

  it("routes locale changes while preserving the workspace path and query", () => {
    const setLocale = vi.fn();
    mockUseLanguage.mockReturnValue({
      locale: "de",
      setLocale,
    });

    render(
      <WorkspaceHeader
        content={getWorkspacePageContent("de")}
        isMobileMenuOpen={false}
        locale="de"
        onMobileMenuToggleAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(setLocale).toHaveBeenCalledWith("en");
    expect(mockRouterReplace).toHaveBeenCalledWith("/en?panel=leads", {
      scroll: false,
    });
  });

  it("toggles theme and mobile navigation state", () => {
    const toggleTheme = vi.fn();
    const onMobileMenuToggle = vi.fn();
    mockUseTheme.mockReturnValue({
      theme: "dark",
      toggleTheme,
    });

    render(
      <WorkspaceHeader
        content={getWorkspacePageContent("de")}
        isMobileMenuOpen={false}
        locale="de"
        onMobileMenuToggleAction={onMobileMenuToggle}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Hellen Modus aktivieren" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));

    expect(toggleTheme).toHaveBeenCalledTimes(1);
    expect(onMobileMenuToggle).toHaveBeenCalledTimes(1);
  });
});
