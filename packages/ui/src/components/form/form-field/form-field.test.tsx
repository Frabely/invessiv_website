// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders input, number, and textarea controls with shared accessibility wiring", () => {
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
          kind={FormFieldKind.Date}
          label="Due on"
          inputProps={{ name: "due-on" }}
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
    expect(screen.getByLabelText(/Due on/)).toHaveAttribute("type", "date");
    expect(screen.getByLabelText(/Notes/)).toHaveAttribute(
      "placeholder",
      "Write something",
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Hint text")).toBeInTheDocument();
  });

  it("wires label, hint, and error accessibility onto a custom control", () => {
    render(
      <FormField
        errorMessage="Choose a category"
        hint="Used for reporting"
        kind={FormFieldKind.Custom}
        label="Assigned category"
        renderControl={({ describedBy, id, invalid }) => (
          <button
            aria-describedby={describedBy}
            data-invalid={invalid || undefined}
            id={id}
            type="button"
          >
            Open category picker
          </button>
        )}
      />,
    );

    const control = screen.getByLabelText(/Assigned category/);
    const label = screen.getByText("Assigned category").closest("label");
    expect(label).toHaveAttribute("for", control.id);
    expect(label?.parentElement?.tagName).toBe("DIV");
    expect(control).toHaveAttribute("data-invalid", "true");
    expect(control).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("hint"),
    );
    expect(control).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("error"),
    );
    expect(screen.getByText("Choose a category")).toBeInTheDocument();
  });
});
