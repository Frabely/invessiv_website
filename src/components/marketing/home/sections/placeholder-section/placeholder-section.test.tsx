// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import styles from "./placeholder-section.module.css";
import { PlaceholderSection } from "./placeholder-section";

describe("PlaceholderSection", () => {
  it("renders scoped section styles and the tall modifier", () => {
    render(
      <PlaceholderSection
        description="Beschreibung"
        id="placeholder"
        isTall
        title="Section title"
      />,
    );

    const section = screen.getByRole("region", { name: "Section title" });
    expect(section.className).toContain(styles.section);
    expect(section.className).toContain(styles.tall);
    expect(screen.getByText("Beschreibung")).toHaveClass(styles.description);
  });
});
