// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useFocusFirstInvalidField } from "./use-focus-first-invalid-field";

afterEach(cleanup);

function ValidationForm({ group = false }: { group?: boolean }) {
  const { formRef, focusFirstInvalidField } = useFocusFirstInvalidField();
  const [invalid, setInvalid] = useState(false);
  return (
    <form ref={formRef}>
      {group ? (
        <fieldset data-invalid={invalid ? "true" : undefined}>
          <legend>Project</legend>
          <input aria-label="Unavailable project" disabled type="radio" />
          <input aria-label="Available project" type="radio" />
        </fieldset>
      ) : null}
      <input aria-label="Title" aria-invalid={invalid ? "true" : undefined} />
      <textarea aria-label="Note" aria-invalid={invalid ? "true" : undefined} />
      <button
        type="button"
        onClick={() => {
          setInvalid(true);
          focusFirstInvalidField();
        }}
      >
        Validate
      </button>
    </form>
  );
}

describe("useFocusFirstInvalidField", () => {
  it("waits for validation to render and focuses the first invalid control", async () => {
    render(<ValidationForm />);
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus(),
    );
  });

  it("focuses the first enabled control of an invalid group before later invalid fields", async () => {
    render(<ValidationForm group />);
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: "Available project" }),
      ).toHaveFocus(),
    );
  });
});
