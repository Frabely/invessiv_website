// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SectionCollapseToggle } from "./section-collapse-toggle";

describe("SectionCollapseToggle", () => {
  afterEach(cleanup);

  it("names the action that a click will perform and reports the expanded state", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <SectionCollapseToggle
        controls="body"
        expanded={false}
        labelCollapse="Collapse tasks"
        labelExpand="Expand tasks"
        onToggleAction={onToggle}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Expand tasks" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "body");
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(
      <SectionCollapseToggle
        controls="body"
        expanded
        labelCollapse="Collapse tasks"
        labelExpand="Expand tasks"
        onToggleAction={onToggle}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Collapse tasks" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
