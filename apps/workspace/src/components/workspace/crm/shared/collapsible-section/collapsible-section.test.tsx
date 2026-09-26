// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CollapsibleSection } from "./collapsible-section";

describe("CollapsibleSection", () => {
  afterEach(cleanup);
  it("keeps the header action available while the body is collapsed", () => {
    const onAction = vi.fn();
    render(
      <CollapsibleSection
        action={<button onClick={onAction}>Add</button>}
        count="2 entries"
        description="Section explanation"
        labelCollapse="Collapse"
        labelExpand="Expand"
        title="Tasks"
      >
        <p>Task list</p>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("Task list")).not.toBeInTheDocument();
    expect(screen.queryByText("Section explanation")).not.toBeInTheDocument();
    expect(screen.getByText("2 entries")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAction).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByText("Task list")).toBeVisible();
    expect(screen.getByText("Section explanation")).toBeVisible();
    expect(screen.getByRole("button", { name: "Collapse" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
