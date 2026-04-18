// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import styles from "./layout-shell.module.css";
import { LayoutShell } from "./layout-shell";

describe("LayoutShell", () => {
  it("renders the shared shell rail and preserves custom classes", () => {
    render(
      <LayoutShell className="custom-shell">
        <section aria-label="First section" />
        <section aria-label="Second section" />
      </LayoutShell>,
    );

    const firstSection = screen.getByRole("region", { name: "First section" });
    const marketingShell = firstSection.parentElement;
    const railShell = marketingShell?.parentElement;

    expect(marketingShell).not.toBeNull();
    expect(marketingShell?.className).toContain(styles.marketing);
    expect(marketingShell?.className).toContain("custom-shell");
    expect(railShell).not.toBeNull();
    expect(railShell?.className).toContain(styles.shell);
    expect(screen.getByRole("region", { name: "Second section" })).toBeTruthy();
  });
});
