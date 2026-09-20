// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TreeNode } from "@invessiv/common/contracts/ui/tree-node";
import { TreeView } from "./tree-view";

afterEach(cleanup);

function buildNode(overrides: Partial<TreeNode> & { id: string }): TreeNode {
  return {
    children: [],
    hasChildren: false,
    label: overrides.id,
    secondaryLabel: null,
    ...overrides,
  };
}

const child = buildNode({ id: "child", label: "Second level" });
const parent = buildNode({
  children: [child],
  hasChildren: true,
  id: "parent",
  label: "First level",
  secondaryLabel: "Subtitle",
});

function renderTree(props: Partial<Parameters<typeof TreeView>[0]> = {}) {
  const onToggleAction = vi.fn();
  render(
    <TreeView
      ariaLabel="Outline"
      collapseLabelTemplate="Collapse: {label}"
      expandLabelTemplate="Expand: {label}"
      expandedIds={[]}
      loadingLabel="Loading children"
      nodes={[parent]}
      onToggleAction={onToggleAction}
      renderRowActions={() => null}
      {...props}
    />,
  );
  return { onToggleAction };
}

describe("TreeView", () => {
  it("renders children of an expanded node inside a nested list", () => {
    renderTree({ expandedIds: ["parent"] });

    const rootList = screen.getByRole("list", { name: "Outline" });
    const nestedList = screen.getByRole("list", { name: "First level" });

    expect(rootList).toContainElement(nestedList);
    expect(screen.getByText("Second level")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("points the toggle at the child list only while it exists", () => {
    const { unmount } = render(
      <TreeView
        ariaLabel="Outline"
        collapseLabelTemplate="Collapse: {label}"
        expandLabelTemplate="Expand: {label}"
        expandedIds={[]}
        loadingLabel="Loading children"
        nodes={[parent]}
        onToggleAction={vi.fn()}
        renderRowActions={() => null}
      />,
    );

    const collapsed = screen.getByRole("button", {
      name: "Expand: First level",
    });
    expect(collapsed).toHaveAttribute("aria-expanded", "false");
    expect(collapsed).not.toHaveAttribute("aria-controls");

    unmount();
    renderTree({ expandedIds: ["parent"] });

    const expanded = screen.getByRole("button", {
      name: "Collapse: First level",
    });
    expect(expanded).toHaveAttribute("aria-expanded", "true");
    expect(expanded.getAttribute("aria-controls")).toBe(
      screen.getByRole("list", { name: "First level" }).id,
    );
  });

  it("omits the toggle for a node that cannot be expanded", () => {
    renderTree({ nodes: [buildNode({ id: "leaf", label: "Standalone" })] });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Standalone")).toBeInTheDocument();
  });

  it("reports the requested state exactly once per toggle", () => {
    const { onToggleAction } = renderTree();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand: First level" }),
    );

    expect(onToggleAction).toHaveBeenCalledTimes(1);
    expect(onToggleAction).toHaveBeenCalledWith("parent", true);
  });

  it("stays controlled: a toggle alone does not open the node", () => {
    renderTree();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand: First level" }),
    );

    expect(
      screen.getByRole("button", { name: "Expand: First level" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Second level")).not.toBeInTheDocument();
  });

  it("shows the loading label while a node has none of its children yet", () => {
    renderTree({
      expandedIds: ["parent"],
      loadingIds: ["parent"],
      nodes: [buildNode({ hasChildren: true, id: "parent", label: "Pending" })],
    });

    expect(screen.getByText("Loading children")).toBeInTheDocument();
  });

  it("hides the loading label once the node is no longer loading", () => {
    renderTree({ expandedIds: ["parent"], loadingIds: [] });

    expect(screen.queryByText("Loading children")).not.toBeInTheDocument();
  });

  it("uses a block container for arbitrary row actions", () => {
    renderTree({
      renderRowActions: () => <div data-testid="row-actions">Action</div>,
    });

    expect(screen.getByTestId("row-actions").parentElement).toHaveProperty(
      "tagName",
      "DIV",
    );
  });

  it("passes every node with its depth to renderRowActions", () => {
    const renderRowActions = vi.fn(() => null);

    renderTree({ expandedIds: ["parent"], renderRowActions });

    expect(renderRowActions).toHaveBeenCalledWith(parent, 0);
    expect(renderRowActions).toHaveBeenCalledWith(child, 1);
  });

  it("renders the empty state instead of the list when there is no node", () => {
    renderTree({ emptyState: <p>Nothing here yet</p>, nodes: [] });

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
