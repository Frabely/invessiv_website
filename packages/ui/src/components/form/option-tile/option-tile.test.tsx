// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import { FormFieldset, OptionTile } from "@invessiv/ui";

describe("OptionTile", () => {
  afterEach(cleanup);

  it("names its control by the tile text and reacts to a click anywhere on it", () => {
    const onChange = vi.fn();
    render(
      <>
        <OptionTile kind={OptionTileKind.Radio} name="shop" onChange={onChange}>
          Yes
        </OptionTile>
        <OptionTile kind={OptionTileKind.Checkbox} onChange={onChange}>
          Newsletter
        </OptionTile>
      </>,
    );

    fireEvent.click(screen.getByText("Yes"));
    fireEvent.click(screen.getByText("Newsletter"));

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Newsletter" })).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("FormFieldset", () => {
  afterEach(cleanup);

  it("names the group by its label and describes it by its hint", () => {
    render(
      <FormFieldset
        errorMessage="Pick one."
        hint="Only one applies."
        label="Shop"
      >
        <OptionTile kind={OptionTileKind.Radio} name="shop">
          Yes
        </OptionTile>
      </FormFieldset>,
    );

    const group = screen.getByRole("group", { name: "Shop" });
    expect(group).toHaveAccessibleDescription("Only one applies.");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick one.");
  });
});
