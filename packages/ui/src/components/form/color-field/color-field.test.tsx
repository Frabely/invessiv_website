// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorField } from "./color-field";

function renderField(value: string) {
  const onChangeAction = vi.fn();
  const onPickAction = vi.fn();
  render(
    <ColorField
      id="brand-color"
      label="Brand colour"
      onChangeAction={onChangeAction}
      onPickAction={onPickAction}
      pickerActionLabel="Pick colour"
      pickerLabel="Pick colour for Brand colour"
      value={value}
    />,
  );
  return { onChangeAction, onPickAction };
}

describe("ColorField", () => {
  afterEach(cleanup);

  it("reports typed text and picked colours through separate callbacks", () => {
    const { onChangeAction, onPickAction } = renderField("");

    fireEvent.change(screen.getByLabelText("Brand colour"), {
      target: { value: "#12" },
    });
    fireEvent.change(screen.getByLabelText("Pick colour for Brand colour"), {
      target: { value: "#336699" },
    });

    expect(onChangeAction).toHaveBeenCalledWith("#12");
    expect(onPickAction).toHaveBeenCalledWith("#336699");
  });

  it("marks the chip empty until the text is a valid colour", () => {
    renderField("#12");
    expect(
      screen.getByLabelText("Pick colour for Brand colour"),
    ).toHaveAttribute("data-empty", "true");
  });

  it("previews a valid colour and lets the visible button open the picker", () => {
    renderField("#AABBCC");
    const picker = screen.getByLabelText("Pick colour for Brand colour");

    expect(picker).not.toHaveAttribute("data-empty");
    expect(picker).toHaveValue("#aabbcc");
    expect(screen.getByText("Pick colour").closest("label")).toHaveAttribute(
      "for",
      picker.id,
    );
  });
});
