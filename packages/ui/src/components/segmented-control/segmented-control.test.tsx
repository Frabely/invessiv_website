// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

const items = [
  { value: "project", label: "Relaunch" },
  { value: "all", label: "All projects" },
] as const;

describe("SegmentedControl", () => {
  afterEach(cleanup);

  it("checks the active segment and keeps only it in the tab order", () => {
    render(
      <SegmentedControl
        activeValue="project"
        ariaLabel="Scope"
        items={items}
        onSelectAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Scope" })).toBeVisible();
    const project = screen.getByRole("radio", { name: "Relaunch" });
    const all = screen.getByRole("radio", { name: "All projects" });
    expect(project).toHaveAttribute("aria-checked", "true");
    expect(project).toHaveAttribute("tabindex", "0");
    expect(all).toHaveAttribute("aria-checked", "false");
    expect(all).toHaveAttribute("tabindex", "-1");
  });

  it("selects on click", () => {
    const onSelectAction = vi.fn();
    render(
      <SegmentedControl
        activeValue="project"
        ariaLabel="Scope"
        items={items}
        onSelectAction={onSelectAction}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "All projects" }));

    expect(onSelectAction).toHaveBeenCalledWith("all");
  });

  it("moves, selects and focuses with the arrow keys, wrapping at the ends", () => {
    const onSelectAction = vi.fn();
    render(
      <SegmentedControl
        activeValue="project"
        ariaLabel="Scope"
        items={items}
        onSelectAction={onSelectAction}
      />,
    );
    const project = screen.getByRole("radio", { name: "Relaunch" });

    fireEvent.keyDown(project, { key: "ArrowRight" });
    expect(onSelectAction).toHaveBeenLastCalledWith("all");
    expect(screen.getByRole("radio", { name: "All projects" })).toHaveFocus();

    fireEvent.keyDown(project, { key: "ArrowLeft" });
    expect(onSelectAction).toHaveBeenLastCalledWith("all");
  });
});
