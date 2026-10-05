// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RadioControl } from "@invessiv/ui";

describe("RadioControl", () => {
  afterEach(cleanup);

  it("keeps a native radio underneath and reports a pick", () => {
    const onChange = vi.fn();
    render(
      <>
        <RadioControl aria-label="Yes" name="shop" onChange={onChange} />
        <RadioControl aria-label="No" defaultChecked name="shop" />
      </>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  it("marks a disabled radio on its frame", () => {
    const { container } = render(<RadioControl aria-label="Yes" disabled />);

    expect(screen.getByRole("radio", { name: "Yes" })).toBeDisabled();
    expect(container.firstElementChild).toHaveAttribute(
      "data-disabled",
      "true",
    );
  });
});
