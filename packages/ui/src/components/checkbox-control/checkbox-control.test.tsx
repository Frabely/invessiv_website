// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckboxControl } from "@invessiv/ui";

describe("CheckboxControl", () => {
  afterEach(cleanup);

  it("forwards an accessible label and changes an enabled checkbox", () => {
    const onChange = vi.fn();
    render(<CheckboxControl aria-label="Permission" onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Permission" }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("keeps a checked read-only value visible and non-interactive", () => {
    render(<CheckboxControl aria-label="Read only" checked disabled />);
    const checkbox = screen.getByRole("checkbox", { name: "Read only" });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it("forwards the input ref for an indeterminate state", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<CheckboxControl aria-label="Select all" ref={inputRef} />);

    expect(inputRef.current).toBe(
      screen.getByRole("checkbox", { name: "Select all" }),
    );
    inputRef.current!.indeterminate = true;
    expect(inputRef.current).toHaveProperty("indeterminate", true);
  });
});
