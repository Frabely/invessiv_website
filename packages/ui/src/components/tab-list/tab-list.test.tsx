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
});
