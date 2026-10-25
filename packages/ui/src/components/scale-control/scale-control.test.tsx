// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScaleControl } from "@invessiv/ui";

const options = ["1", "2", "3", "4", "5"].map((value) => ({
  value,
  label: value,
  accessibleLabel: `Level ${value}`,
}));
afterEach(cleanup);

describe("ScaleControl", () => {
  it("reports a selected level and reflects a cleared controlled value", () => {
    const onChangeAction = vi.fn();
    const { rerender } = render(
      <ScaleControl
        id="scale"
        options={options}
        value="2"
        onChangeAction={onChangeAction}
      />,
    );
    expect(screen.getByRole("radio", { name: "Level 2" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Level 4" }));
    expect(onChangeAction).toHaveBeenCalledWith("4");
    rerender(
      <ScaleControl
        options={options}
        value=""
        onChangeAction={onChangeAction}
      />,
    );
    expect(
      screen
        .getAllByRole("radio")
        .every((input) => !(input as HTMLInputElement).checked),
    ).toBe(true);
  });

  it("disables every level and keeps the selected answer", () => {
    render(
      <ScaleControl
        disabled
        options={options}
        value="3"
        onChangeAction={vi.fn()}
      />,
    );
    for (const radio of screen.getAllByRole("radio"))
      expect(radio).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Level 3" })).toBeChecked();
  });

  it("renders a compact noninteractive picture for a read-only answer", () => {
    const { container } = render(
      <ScaleControl
        compact
        low="Low"
        high="High"
        options={options}
        value="5"
      />,
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      container.querySelector('[data-compact="true"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-checked="true"]')).toHaveTextContent(
      "5",
    );
  });

  it("gives separate radio groups distinct names without an explicit id", () => {
    render(
      <>
        <ScaleControl options={options} value="" onChangeAction={vi.fn()} />
        <ScaleControl options={options} value="" onChangeAction={vi.fn()} />
      </>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0].name).toBe(radios[4].name);
    expect(radios[0].name).not.toBe(radios[5].name);
  });
});
