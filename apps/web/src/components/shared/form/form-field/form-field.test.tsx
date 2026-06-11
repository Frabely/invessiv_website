// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders input, select, textarea, and number controls with shared accessibility wiring", () => {
    render(
      <div>
        <FormField
          errorMessage="Required"
          hint="Hint text"
          kind={FormFieldKind.Text}
          label="First name"
          required
          inputProps={{
            placeholder: "Jane",
          }}
        />
        <FormField
          kind={FormFieldKind.Number}
          label="Score"
          inputProps={{
            placeholder: "0 to 100",
          }}
        />
        <FormField
          kind={FormFieldKind.Select}
          label="Category"
          options={[
            { label: "Choose", value: "" },
            { label: "Coaches", value: "coaches" },
          ]}
          selectProps={{
            "data-empty": "true",
          }}
        />
        <FormField
          kind={FormFieldKind.Textarea}
          label="Notes"
          textareaProps={{
            placeholder: "Write something",
          }}
        />
      </div>,
    );

    expect(screen.getByLabelText(/First name/)).toHaveAttribute(
      "placeholder",
      "Jane",
    );
    expect(screen.getByLabelText(/First name/)).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("hint"),
    );
    expect(screen.getByLabelText(/First name/)).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("error"),
    );
    expect(screen.getByLabelText(/Score/)).toHaveAttribute("type", "number");
    expect(screen.getByLabelText(/Category/)).toHaveAttribute(
      "data-empty",
      "true",
    );
    expect(screen.getByLabelText(/Notes/)).toHaveAttribute(
      "placeholder",
      "Write something",
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Hint text")).toBeInTheDocument();
  });

  it("hosts a custom control with anchored error id and visual-only label suffix", () => {
    render(
      <FormField
        controlId="tone"
        errorMessage="Pick a tone"
        kind={FormFieldKind.Custom}
        label="Tone"
        labelSuffix="3/3"
      >
        <button aria-describedby="tone-error" id="tone" type="button">
          Open tone picker
        </button>
      </FormField>,
    );

    // The wrapping label provides the accessible name, so the button is
    // queried by the field label, not by its own content.
    const control = screen.getByRole("button", { name: /Tone/ });
    expect(control).toBeInTheDocument();
    expect(control).toHaveTextContent("Open tone picker");
    expect(screen.getByText("Pick a tone")).toHaveAttribute("id", "tone-error");
    expect(screen.getByText("3/3")).toHaveAttribute("aria-hidden", "true");
  });
});
