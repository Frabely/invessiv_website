// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WidgetGrid } from "@invessiv/ui";

describe("WidgetGrid", () => {
  afterEach(cleanup);

  it("orders populated slots and exposes their responsive spans", () => {
    render(
      <WidgetGrid
        layout={[
          {
            key: "second",
            order: 20,
            span: { mobile: 12, tablet: 6, desktop: 4 },
          },
          {
            key: "first",
            order: 10,
            span: { mobile: 12, tablet: 12, desktop: 8 },
          },
          {
            key: "missing",
            order: 30,
            span: { mobile: 12, tablet: 6, desktop: 4 },
          },
        ]}
        slots={{ first: <p>First</p>, second: <p>Second</p> }}
      />,
    );

    const slots = screen
      .getAllByText(/First|Second/)
      .map((node) => node.parentElement);
    expect(slots.map((slot) => slot?.dataset.widget)).toEqual([
      "first",
      "second",
    ]);
    expect(slots[1]).toHaveAttribute("data-mobile-span", "12");
    expect(slots[1]).toHaveAttribute("data-tablet-span", "6");
    expect(slots[1]).toHaveAttribute("data-desktop-span", "4");
    expect(document.querySelector('[data-widget="missing"]')).toBeNull();
  });
});
