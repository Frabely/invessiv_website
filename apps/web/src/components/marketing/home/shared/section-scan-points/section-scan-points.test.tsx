// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import styles from "./section-scan-points.module.css";
import { SectionScanPoints } from "./section-scan-points";

describe("SectionScanPoints", () => {
  it("renders trimmed scan points with the shared scoped styles", () => {
    render(
      <SectionScanPoints
        ariaLabel="Highlights"
        points={[" Klarer Scope ", "", "Fester Ansprechpartner"]}
      />,
    );

    const list = screen.getByRole("list", { name: "Highlights" });
    expect(list.className).toContain(styles.list);
    expect(screen.getByText("Klarer Scope")).toBeTruthy();
    expect(screen.getByText("Fester Ansprechpartner")).toBeTruthy();
  });

  it("renders fallback text without requiring a fallback class", () => {
    render(<SectionScanPoints fallbackText="Fallback text" points={[]} />);

    expect(screen.getByText("Fallback text").tagName).toBe("P");
  });
});
