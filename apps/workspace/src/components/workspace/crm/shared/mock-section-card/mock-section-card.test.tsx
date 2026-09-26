// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MockSectionCard } from "./mock-section-card";

describe("MockSectionCard", () => {
  afterEach(cleanup);

  it("shows the title and the coming-soon badge, reveals the purpose only on demand and offers no action", () => {
    render(
      <MockSectionCard
        badgeLabel="Coming soon"
        body="Files will live here."
        labelCollapse="Collapse files"
        labelExpand="Expand files"
        title="Files"
      />,
    );

    expect(screen.getByRole("heading", { name: "Files" })).toBeVisible();
    expect(screen.getByText("Coming soon")).toBeVisible();
    expect(screen.queryByText("Files will live here.")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Expand files" }));
    expect(screen.getByText("Files will live here.")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Collapse files" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
