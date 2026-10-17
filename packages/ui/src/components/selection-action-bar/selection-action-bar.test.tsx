// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SelectionActionBar } from "@invessiv/ui";

describe("SelectionActionBar", () => {
  afterEach(cleanup);

  it("names the region by the count and shows hint and actions", () => {
    render(
      <SelectionActionBar
        actions={<button type="button">Clear</button>}
        hint="At most 100 entries."
        summary="3 selected"
      />,
    );

    const region = screen.getByRole("region", { name: "3 selected" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("At most 100 entries.");
    expect(screen.getByRole("button", { name: "Clear" })).toBeVisible();
  });

  it("leaves the hint out when there is none", () => {
    const { container } = render(
      <SelectionActionBar actions={null} summary="1 selected" />,
    );

    expect(container.querySelectorAll("p span")).toHaveLength(0);
  });
});
