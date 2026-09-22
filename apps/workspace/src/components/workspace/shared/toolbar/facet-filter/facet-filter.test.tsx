// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FacetFilterDisplay } from "@/common/constants/ui/facet-filter-displays";
import { FacetFilter } from "./facet-filter";

const OPTIONS = [
  { chip: "One", selectLabel: "One", value: "one" },
  { chip: "Two", selectLabel: "Two", value: "two" },
];

function renderFacet(
  props: Partial<Parameters<typeof FacetFilter>[0]> = {},
  onChange = vi.fn(),
) {
  render(
    <FacetFilter
      allOption={{ chip: "All", selectLabel: "All" }}
      ariaLabel="Filter by number"
      clearLabel="Clear"
      label="Number"
      onChangeAction={onChange}
      options={OPTIONS}
      selectId="number-filter"
      {...props}
    />,
  );
  return onChange;
}

describe("FacetFilter", () => {
  afterEach(cleanup);

  it("shows one chip per value plus the all option and reports the picked value", () => {
    const onChange = renderFacet();

    fireEvent.click(screen.getByRole("button", { name: "Two" }));

    expect(onChange).toHaveBeenCalledWith("two");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("marks the active chip and clears back to undefined through the all chip", () => {
    const onChange = renderFacet({ activeValue: "one" });

    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("defaults to the chip display and can be set to select-only", () => {
    renderFacet();
    expect(
      screen.getByRole("toolbar", { name: "Filter by number" }).parentElement,
    ).toHaveAttribute("data-display", FacetFilterDisplay.Chips);
    cleanup();

    renderFacet({ display: FacetFilterDisplay.Select });
    expect(
      screen.getByRole("toolbar", { name: "Filter by number" }).parentElement,
    ).toHaveAttribute("data-display", FacetFilterDisplay.Select);
  });
});
