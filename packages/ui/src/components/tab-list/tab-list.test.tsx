// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TabList } from "./tab-list";

describe("TabList", () => {
  afterEach(cleanup);
  it("selects and focuses tabs with arrow and boundary keys", () => {
    const onSelectAction = vi.fn();
    render(
      <TabList
        activeValue="first"
        ariaLabel="Sections"
        items={[
          {
            value: "first",
            id: "first-tab",
            panelId: "first-panel",
            label: "First",
          },
          {
            value: "second",
            id: "second-tab",
            panelId: "second-panel",
            label: "Second",
          },
        ]}
        onSelectAction={onSelectAction}
      />,
    );

    const first = screen.getByRole("tab", { name: "First" });
    const second = screen.getByRole("tab", { name: "Second" });
    expect(first).toHaveAttribute("aria-controls", "first-panel");
    expect(first).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(onSelectAction).toHaveBeenCalledWith("second");
    expect(second).toHaveFocus();
    fireEvent.keyDown(second, { key: "Home" });
    expect(onSelectAction).toHaveBeenCalledWith("first");
    expect(first).toHaveFocus();
  });

  it("marks only invalid tabs", () => {
    render(
      <TabList
        activeValue="first"
        ariaLabel="Sections"
        items={[
          { value: "first", id: "a", panelId: "pa", label: "First" },
          {
            value: "second",
            id: "b",
            panelId: "pb",
            label: "Second",
            invalid: true,
          },
        ]}
        onSelectAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(screen.getByRole("tab", { name: "First" })).not.toHaveAttribute(
      "data-invalid",
    );
  });

  it("keeps its own styling when a layout class is added", () => {
    render(
      <TabList
        activeValue="first"
        ariaLabel="Sections"
        className="layout"
        items={[{ value: "first", id: "a", panelId: "pa", label: "First" }]}
        onSelectAction={vi.fn()}
      />,
    );

    const list = screen.getByRole("tablist");
    expect(list).toHaveClass("layout");
    expect(list.classList.length).toBeGreaterThan(1);
  });
});
