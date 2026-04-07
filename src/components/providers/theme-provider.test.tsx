// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

const mockSetTheme = vi.fn();
const mockUseNextTheme = vi.fn();

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="next-themes-provider">{children}</div>
  ),
  useTheme: () => mockUseNextTheme(),
}));

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <span>{theme}</span>
      <button onClick={toggleTheme} type="button">
        toggle
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockUseNextTheme.mockReturnValue({
      resolvedTheme: "dark",
      setTheme: mockSetTheme,
    });
  });

  it("renders the next-themes provider wrapper", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <div>content</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("next-themes-provider")).toBeTruthy();
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("exposes the resolved theme and toggle handler", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByText("dark")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("maps light as the active theme", () => {
    mockUseNextTheme.mockReturnValue({
      resolvedTheme: "light",
      setTheme: mockSetTheme,
    });

    render(
      <ThemeProvider initialTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByText("light")).toBeTruthy();
  });
});
