// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import styles from "./layout-shell.module.css";
import { LayoutShell } from "./layout-shell";

describe("LayoutShell", () => {
  it("renders the shared shell classes and preserves custom classes", () => {
    render(
      <LayoutShell className="custom-shell">
        <section aria-label="First section" />
        <section aria-label="Second section" />
      </LayoutShell>,
    );

    const firstSection = screen.getByRole("region", { name: "First section" });
    const shell = firstSection.parentElement;

    expect(shell).not.toBeNull();
    expect(shell?.className).toContain(styles.shell);
    expect(shell?.className).toContain(styles.marketing);
    expect(shell?.className).toContain("custom-shell");
    expect(screen.getByRole("region", { name: "Second section" })).toBeTruthy();
  });
});
