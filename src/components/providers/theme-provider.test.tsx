// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

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
    window.localStorage.clear();
    document.cookie = "invessiv-theme=; Max-Age=0; Path=/";
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  });

  it("restores the theme from the document element", async () => {
    document.documentElement.dataset.theme = "light";

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("light")).toBeTruthy();
      expect(window.localStorage.getItem("invessiv-theme")).toBe("light");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });
  });

  it("persists toggled themes to localStorage and cookie", async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => {
      expect(screen.getByText("light")).toBeTruthy();
      expect(window.localStorage.getItem("invessiv-theme")).toBe("light");
      expect(document.cookie).toContain("invessiv-theme=light");
    });
  });
});
