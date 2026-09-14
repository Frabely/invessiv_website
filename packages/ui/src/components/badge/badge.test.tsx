// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "./badge";

afterEach(() => {
  cleanup();
});

describe("Badge", () => {
  it("renders the icon, label, and tone marker", () => {
    render(
      <Badge
        categoryKey="coaches"
        icon={faLayerGroup}
        kind="category"
        label="Coaches"
        tone="primary"
      />,
    );

    const badge = screen.getByText("Coaches").closest("[data-tone='primary']");

    expect(badge).not.toBeNull();
    expect(badge).toHaveAttribute("data-kind", "category");
    expect(badge).toHaveAttribute("data-category-key", "coaches");
    expect(badge?.querySelector("svg")).toBeInTheDocument();
  });
});
