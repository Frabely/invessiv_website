// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders input, select, textarea, and number controls with shared accessibility wiring", () => {
    render(
      <div>
        <FormField
          errorMessage="Required"
          hint="Hint text"
          kind="text"
          label="First name"
          required
          inputProps={{
            placeholder: "Jane",
          }}
        />
        <FormField
          kind="number"
          label="Score"
          inputProps={{
            placeholder: "0 to 100",
          }}
        />
        <FormField
          kind="select"
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
          kind="textarea"
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
});
